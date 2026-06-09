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
    "Location",
    "Services Provided in Clinic"
]
LLM_RESPONSES = {
    "Irrelevant": "Oops! It looks like that's something I'm not trained to answer. Please ask me something related to the clinic, and I'll be happy to help.",

    "Doctors Experience": "I can guide you to where you’ll find the answer. Please click the button with three lines at the top left and select 'Doctor’s Experience'.",

    "Chamber timings": "To check the chamber timings, please open the three-line menu at the top left and select 'About'. Scroll down to find the timings. Also, don't forget to check the 'Announcements' section for any temporary changes or updates.",

    "Basic instructions after tooth extraction": "I'd be glad to help. For post-extraction care instructions, please open the three-line menu at the top left and select 'Rules and Regulations'. You'll find all the important guidelines there.",

    "Book appointment": "I'd be glad to help. To book an appointment, please click the three-line menu at the top left and select 'Contact Us'.",

    "Staff Information": "To view information about our staff, please open the three-line menu at the top left and select 'Staff'.",

    "Rules & Regulations": "You can find the clinic's rules and regulations by opening the three-line menu at the top left and selecting 'Rules and Regulations'.",

    "Urgency": f"If your situation is urgent, please contact the number {DOCTOR_NUMBER}",

    "Location": "Need directions? Simply open the three-line menu at the top left, select 'About', and then click the Google Maps button located at the top right.",

    "Services Provided in Clinic": "I'd be happy to help. To see the services available at our clinic, please open the three-line menu at the top left and select 'Services Provided'."
}
