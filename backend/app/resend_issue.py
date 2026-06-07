import os
import resend
from dotenv import load_dotenv

# Load environment variables from the .env file located two directories up
load_dotenv(dotenv_path="../../.env")

resend.api_key = os.getenv("RESEND_API_KEY")

params: resend.Emails.SendParams = {
    "from": "dentalclinicissue@resend.dev", # Using the default test email. If you have a verified domain, replace this.
    "to": ["atmajoburman7@gmail.com"],
    "subject": "Hello",
    "html": "<h2>Hello buddy</h2>",
}

response = resend.Emails.send(params)
print(response)