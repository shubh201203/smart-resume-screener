import json
import re
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.llm.prompts import (
    RESUME_EXTRACTION_PROMPT,
    JOB_EXTRACTION_PROMPT,
    SEMANTIC_MATCHING_PROMPT,
    CANDIDATE_COMPARISON_PROMPT
)

class LLMError(Exception):
    """Custom exception raised when LLM API call fails or yields invalid JSON."""
    pass

class LLMClient:
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model_name = settings.LLM_MODEL_NAME
        self.base_url = settings.LLM_BASE_URL.rstrip("/")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and self.api_key != "your_llm_api_key_here")

    async def _completion(self, system_prompt: str, user_prompt: str, temperature: float = 0.1) -> str:
        if not self.is_configured:
            raise LLMError("LLM API key is not configured.")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content
        except Exception as e:
            raise LLMError(f"LLM API request failed: {str(e)}")

    def _clean_and_parse_json(self, raw_response: str) -> Dict[str, Any]:
        """Extract and validate JSON from LLM text response."""
        cleaned = raw_response.strip()
        # Handle markdown ```json codeblock wrapper
        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned, re.IGNORECASE)
        if match:
            cleaned = match.group(1).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise LLMError(f"Failed to parse JSON response from LLM: {str(e)}")

    async def extract_candidate_profile(self, resume_text: str) -> Dict[str, Any]:
        prompt = RESUME_EXTRACTION_PROMPT.format(resume_text=resume_text[:12000])
        raw = await self._completion(
            system_prompt="You are a precise JSON resume extraction API. Respond only in JSON.",
            user_prompt=prompt
        )
        return self._clean_and_parse_json(raw)

    async def extract_job_profile(self, job_text: str) -> Dict[str, Any]:
        prompt = JOB_EXTRACTION_PROMPT.format(job_text=job_text[:10000])
        raw = await self._completion(
            system_prompt="You are a precise JSON job requirement parser. Respond only in JSON.",
            user_prompt=prompt
        )
        return self._clean_and_parse_json(raw)

    async def analyze_semantic_match(self, job_data: Dict[str, Any], candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = SEMANTIC_MATCHING_PROMPT.format(
            job_json=json.dumps(job_data, indent=2),
            candidate_json=json.dumps(candidate_data, indent=2)
        )
        raw = await self._completion(
            system_prompt="You are an expert recruitment matching engine. Respond only in JSON.",
            user_prompt=prompt
        )
        return self._clean_and_parse_json(raw)

    async def compare_candidates(self, job_title: str, candidates_summary: str) -> str:
        prompt = CANDIDATE_COMPARISON_PROMPT.format(
            job_title=job_title,
            candidates_summary=candidates_summary
        )
        raw = await self._completion(
            system_prompt="You are an AI recruitment comparison assistant. Respond only in JSON.",
            user_prompt=prompt
        )
        parsed = self._clean_and_parse_json(raw)
        return parsed.get("comparison_summary", "Candidate comparison complete.")

llm_client = LLMClient()
