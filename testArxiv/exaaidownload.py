import requests
import os
import logging
from urllib.parse import urljoin

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_pmc_pdf(url, output_dir="papers"):
    """
    Download PDF from PMC article
    
    Args:
        url: PMC article URL
        output_dir: Directory to save the PDF
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Add proper headers to mimic a browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    }
    
    try:
        # First get the article page to find the PDF link
        logger.info(f"Fetching article page from {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            # The PDF link is typically in the "PDF" button
            # For PMC9478531, the direct PDF URL is:
            pdf_url = "https://pmc.ncbi.nlm.nih.gov/articles/PMC8507271/"
            
            # Download the PDF with the same headers
            logger.info("Downloading PDF...")
            pdf_response = requests.get(pdf_url, headers=headers)
            
            if pdf_response.status_code == 200:
                # Create a descriptive filename
                filename = "PIM2_expression_immunotherapy_HCC.pdf"
                output_path = os.path.join(output_dir, filename)
                
                with open(output_path, 'wb') as f:
                    f.write(pdf_response.content)
                logger.info(f"Successfully downloaded PDF to {output_path}")
                return output_path
            else:
                logger.error(f"Failed to download PDF. Status code: {pdf_response.status_code}")
        else:
            logger.error(f"Failed to fetch article page. Status code: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error downloading PDF: {str(e)}")
    
    return None

if __name__ == "__main__":
    url = "https://pmc.ncbi.nlm.nih.gov/articles/PMC8507271/"
    download_pmc_pdf(url)