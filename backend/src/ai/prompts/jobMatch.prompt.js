const { ChatPromptTemplate } = require('@langchain/core/prompts');

/**
 * Job Matching Prompt Template
 * 
 * This prompt instructs the LLM to act as an expert technical recruiter
 * and analyze the compatibility between a candidate's resume and a job description.
 * 
 * Output: Strict JSON format with score, matched/missing skills, and reasoning
 */

const JOB_MATCH_SYSTEM_PROMPT = `You are an expert technical recruiter with deep knowledge of software engineering, data science, and tech industry roles.

Your task is to analyze how well a candidate's resume matches a specific job description.

Evaluation Criteria:
1. **Technical Skills Match**: Compare required skills vs candidate's skills
2. **Experience Level**: Assess if experience aligns with job requirements
3. **Keyword Overlap**: Identify relevant keywords present in both
4. **Role Compatibility**: Evaluate if the candidate's background fits the role

Scoring Guidelines:
- 90-100: Exceptional match, candidate exceeds requirements
- 75-89: Strong match, candidate meets most requirements
- 60-74: Good match, candidate meets core requirements with some gaps
- 45-59: Moderate match, significant gaps but potential fit
- 30-44: Weak match, major gaps in requirements
- 0-29: Poor match, fundamental misalignment

CRITICAL: You must respond with ONLY valid JSON. No markdown, no code blocks, no explanations outside the JSON.`;

const JOB_MATCH_USER_PROMPT = `Analyze this candidate-job match:

CANDIDATE RESUME:
{resumeText}

JOB DESCRIPTION:
Title: {jobTitle}
Company: {jobCompany}
Description: {jobDescription}

Respond with ONLY this JSON structure (no markdown, no code blocks):
{{
  "score": <number between 0-100>,
  "matchedSkills": [<array of skills found in both resume and job>],
  "missingSkills": [<array of required skills not in resume>],
  "reasoning": "<2-3 sentence explanation of the score>"
}}`;

// Create the prompt template
const jobMatchPromptTemplate = ChatPromptTemplate.fromMessages([
    ['system', JOB_MATCH_SYSTEM_PROMPT],
    ['user', JOB_MATCH_USER_PROMPT]
]);

module.exports = {
    jobMatchPromptTemplate,
    JOB_MATCH_SYSTEM_PROMPT,
    JOB_MATCH_USER_PROMPT
};
