from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate
import os
import logging
from app.core.chatbot_config import OPTIONS, LLM_RESPONSES, HF_MODEL_NAME

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str

class Response(BaseModel):
    response: Literal[tuple(OPTIONS)] = Field(description="Category of the query")

pydantic_parser = PydanticOutputParser(pydantic_object=Response)

prompt_template = PromptTemplate(
    template="""You are a ChatModel embedded in a Doctors Dental Clinic Website. Categorize the user's query into one of the following categories where the user can most likely get the answer to the query:
{options}
Your output MUST be a JSON object, and it MUST be enclosed in markdown code fences (```json...```).
Do NOT include any conversational text or explanations outside of the JSON block.
{format_instructions}
Query: {query}
""",
    input_variables=["query"],
    partial_variables={
        "format_instructions": pydantic_parser.get_format_instructions(),
        "options": str(OPTIONS)
    },
)

@router.post("/")
async def chat(request: QueryRequest):
    hf_api_ = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if not hf_api_:
        raise HTTPException(status_code=500, detail="HuggingFace API token not configured")
    
    try:
        llm = HuggingFaceEndpoint(
            repo_id=HF_MODEL_NAME,
            task="text-generation",
            huggingfacehub_api_token=hf_api_
        )
        model_hf = ChatHuggingFace(llm=llm)
        chain_pydantic_huggingface = prompt_template | model_hf | pydantic_parser
        
        result_pydantic_huggingface = chain_pydantic_huggingface.invoke({"query": request.query})
        category = result_pydantic_huggingface.response
        
        bot_response = LLM_RESPONSES.get(category, LLM_RESPONSES["Irrelevant"])
        return {"response": bot_response}
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")
