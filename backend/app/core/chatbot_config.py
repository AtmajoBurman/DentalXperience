import os
DOCTOR_NUMBER = os.getenv("DOCTOR_CONTACT")
HF_MODEL_NAME = os.getenv("HF_MODEL_NAME", "meta-llama/Llama-3.3-70B-Instruct")

OPTIONS = [
    "Irrelevant",
    "Doctors Experience",
    "Chamber timings",
    "Basic instructions after tooth extraction",
    "Book appointment",
    "Staff Information",
    "Rules & Regulations",
    "Urgency",
    "Location"
]

LLM_RESPONSES = {
    "Irrelevant": "Oops! It seems to be a query I’m not prepared to answer. Please ask something related to the clinic.",
    "Doctors Experience": "I can guide you to where you’ll find the answer. Please click the button with three lines at the top left and select 'Doctor’s Experience'.",
    "Chamber timings": "You can find the chamber timings by clicking the button with three lines at the top left and selecting 'About' and scrolling down, also please consider checking the 'Announcements' section, in case there is change in timings due to some reason.",
    "Basic instructions after tooth extraction": "Please click the button with three lines at the top left and select 'Rules and Regulations' to view the post‑treatment guidelines.",
    "Book appointment": "To book an appointment, click the button with three lines at the top left and choose 'Contact Us'.",
    "Staff Information": "You can view staff details by clicking the button with three lines at the top left and selecting 'Staff'.",
    "Rules & Regulations": "Clinic rules and regulations are available under 'Rules and Regulations' in the menu accessed by the three‑line button at the top left.",
    "Urgency": f"If your situation is urgent, please contact the number {DOCTOR_NUMBER}",
    "Location": "To view the clinic’s location, click the button with three lines at the top left and select 'About' and click the Google Maps button on top right."
}
