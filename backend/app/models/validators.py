import re
from pydantic import AnyUrl

def is_google_drive_link(url: AnyUrl) -> AnyUrl:
    """Validator to ensure a URL is a Google Drive link."""
    url_str = str(url)
    if not (url_str.startswith("https://drive.google.com/") or url_str.startswith("http://drive.google.com/")):
        raise ValueError("URL must be a valid Google Drive link")
    return url
