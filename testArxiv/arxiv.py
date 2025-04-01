import urllib.request as libreq
import os

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
arxiv_id = '2303.08774'  # Replace with the arXiv ID you want to download
downloaded_path = download_arxiv_paper(arxiv_id)