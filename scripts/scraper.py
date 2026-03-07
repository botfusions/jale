import sys
import json
from scrapling import fetcher

def scrape_url(url):
    try:
        # Initialize Scrapling fetcher
        # Using auto mode which attempts best method
        f = fetcher.Fetcher(url)
        
        # Get the main content (cleaned from boilerplate)
        content = f.text
        title = f.soup.title.string if f.soup.title else "No Title"
        
        result = {
            "status": "success",
            "url": url,
            "title": title,
            "content": content[:10000] # Limit content to 10k chars for LLM
        }
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No URL provided"}))
        sys.exit(1)
        
    target_url = sys.argv[1]
    output = scrape_url(target_url)
    print(json.dumps(output, ensure_ascii=False))
