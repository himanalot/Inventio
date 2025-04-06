import urllib.request as libreq
import os
import urllib.parse
import feedparser
import time

class ArxivSearchParams:
    """Search parameters for arXiv API"""
    SORT_BY = {
        'relevance': 'relevance',
        'last_updated': 'lastUpdatedDate',
        'submitted': 'submittedDate'
    }
    
    SORT_ORDER = {
        'ascending': 'ascending',
        'descending': 'descending'
    }
    
    FIELDS = {
        'title': 'ti',
        'author': 'au',
        'abstract': 'abs',
        'comment': 'co',
        'journal': 'jr',
        'category': 'cat',
        'report_num': 'rn',
        'all': 'all'
    }

def construct_query(**kwargs):
    """
    Construct an arXiv query from keyword arguments
    
    Args:
        **kwargs: Field-value pairs for search. Special keys:
            - title: Search in title
            - author: Search for author
            - abstract: Search in abstract
            - category: Search in specific category
            - all: Search in all fields
    
    Returns:
        str: Formatted query string
    """
    query_parts = []
    
    for field, value in kwargs.items():
        if field in ArxivSearchParams.FIELDS and value:
            # Handle multiple authors
            if field == 'author' and isinstance(value, (list, tuple)):
                value = ' AND '.join(f'au:"{author}"' for author in value)
            else:
                value = f'{ArxivSearchParams.FIELDS[field]}:"{value}"'
            query_parts.append(value)
    
    return ' AND '.join(query_parts) if query_parts else 'all:*'

def search_arxiv(query=None, max_results=10, start=0, sort_by='relevance', 
                sort_order='descending', delay=3, **search_kwargs):
    """
    Enhanced arXiv search with more options
    
    Args:
        query (str, optional): Raw query string (if not using field-specific search)
        max_results (int): Maximum number of results to return (max 2000 per call)
        start (int): Starting index for results
        sort_by (str): Sort results by ('relevance', 'last_updated', 'submitted')
        sort_order (str): Sort order ('ascending' or 'descending')
        delay (int): Seconds to wait between API calls
        **search_kwargs: Field-specific search terms (title, author, abstract, etc.)
    
    Returns:
        list: List of dictionaries containing paper information
    """
    # Format the search URL
    base_url = 'http://export.arxiv.org/api/query?'
    
    # Construct the query
    if query is None:
        search_query = construct_query(**search_kwargs)
    else:
        search_query = query
    
    # URL encode the query
    search_query = urllib.parse.quote(search_query)
    
    # Validate and get sort parameters
    sort_by = ArxivSearchParams.SORT_BY.get(sort_by, 'relevance')
    sort_order = ArxivSearchParams.SORT_ORDER.get(sort_order, 'descending')
    
    # Construct the full URL
    search_url = (f'{base_url}search_query={search_query}'
                 f'&start={start}'
                 f'&max_results={min(max_results, 2000)}'
                 f'&sortBy={sort_by}'
                 f'&sortOrder={sort_order}')
    
    # Respect rate limiting
    time.sleep(delay)
    
    # Get the response
    response = libreq.urlopen(search_url)
    feed = feedparser.parse(response.read())
    
    # Parse the results
    papers = []
    for entry in feed.entries:
        paper = {
            'title': entry.title,
            'authors': [author.name for author in entry.authors],
            'summary': entry.summary,
            'published': entry.published,
            'updated': entry.get('updated', ''),
            'arxiv_id': entry.id.split('/abs/')[-1],
            'link': entry.link,
            'categories': entry.get('tags', []),
            'comment': entry.get('comment', ''),
            'journal_ref': entry.get('journal_ref', '')
        }
        papers.append(paper)
    
    return papers

def download_arxiv_paper(arxiv_id, save_dir='papers'):
    # Create papers directory if it doesn't exist
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    # Format the PDF URL - arXiv papers can be downloaded by adding 'pdf' to the ID URL
    pdf_url = f'https://arxiv.org/pdf/{arxiv_id}.pdf'
    save_path = os.path.join(save_dir, f'{arxiv_id}.pdf')
    
    try:
        # Download the PDF
        libreq.urlretrieve(pdf_url, save_path)
        print(f"Successfully downloaded paper to {save_path}")
        return save_path
    except Exception as e:
        print(f"Error downloading paper: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Example 1: Simple search
    results = search_arxiv("quantum computing", max_results=5)
    
    # Example 2: Field-specific search
    results = search_arxiv(
        title="quantum computing",
        author=["John Preskill", "Peter Shor"],
        category="quant-ph",
        sort_by="last_updated",
        max_results=5
    )
    
    # Print results
    for paper in results:
        print(f"\nTitle: {paper['title']}")
        print(f"Authors: {', '.join(paper['authors'])}")
        print(f"arXiv ID: {paper['arxiv_id']}")
        print(f"Categories: {paper['categories']}")
        print(f"Updated: {paper['updated']}")
        download_arxiv_paper(paper['arxiv_id'])
        # Download the paper if desired
        # downloaded_path = download_arxiv_paper(paper['arxiv_id'])