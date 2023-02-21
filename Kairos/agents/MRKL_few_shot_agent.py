from typing import List, Optional

from langchain.agents import ZeroShotAgent, Tool
from langchain.prompts import PromptTemplate


PREFIX = """Answer the following questions as best you can. You have access to the following tools:"""

FORMAT_INSTRUCTIONS = """Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question"""

SUFFIX = """Begin!

Question: {input}
Thought:{agent_scratchpad}"""

EXAMPLES = """Examples:

Question: What is the capital of France?
Thought: I need to find the capital of France
Action: Search
Action Input: Capital of France
Observation: Paris is the capital of France
Thought: I now know the final answer
Final Answer: Paris

Question: Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?
Thought: I need to find out who Olivia Wilde's boyfriend is and his age raised to the 0.23 power
Action: Search
Action Input: Olivia Wilde boyfriend
Observation: Jason Sudeikis
Thought: I need to find out his age
Action: Search
Action Input: Jason Sudeikis age
Observation: 47 years
Thought: I need to calculate his age raised to the 0.23 power
Action: Calculator
Action Input: 47^0.23
Observation: Answer: 2.4242784855673896
Thought: I now know the final answer
Final Answer: Jason Sudeikis is Olivia Wilde's boyfriend and his current age raised to the 0.23 power is 2.4242784855673896.

Question: What is the conversion rate of CLP to USD? How much 100000 CLP is in USD?
Thought: I need to find out the conversion rate of CLP to USD and how much 100000 CLP is in USD
Action: Search
Action Input: CLP to USD conversion rate
Observation: Convert Chilean Peso to US Dollar ; 500 CLP, 0.631269 USD ; 1,000 CLP, 1.26254 USD ; 5,000 CLP, 6.31269 USD ; 10,000 CLP, 12.6254 USD.
Thought: I need to calculate how much 100000 CLP is in USD
Action: Calculator
Action Input: 100000/500*0.631269
Observation: Answer: 126.2538
Thought: I now know the final answer
Final Answer: The conversion rate of CLP to USD is 500 CLP to 0.631269 USD. 100000 CLP is equal to 126.2538 USD."""


class FewShotAgent(ZeroShotAgent):
    @property
    def _agent_type(self) -> str:
        return "few-shot-react-description"

    @classmethod
    def create_prompt(
        cls,
        tools: List[Tool],
        prefix: str = PREFIX,
        suffix: str = SUFFIX,
        format_instructions: str = FORMAT_INSTRUCTIONS,
        examples: str = EXAMPLES,
        input_variables: Optional[List[str]] = None,
    ) -> PromptTemplate:
        """Create prompt in the style of the few shot agent.

        Args:
            tools: List of tools the agent will have access to, used to format the
                prompt.
            prefix: String to put before the list of tools.
            suffix: String to put after the list of tools.
            input_variables: List of input variables the final prompt will expect.

        Returns:
            A PromptTemplate with the template assembled from the pieces here.
        """
        tool_strings = "\n".join([f"{tool.name}: {tool.description}" for tool in tools])
        tool_names = ", ".join([tool.name for tool in tools])
        format_instructions = format_instructions.format(tool_names=tool_names)
        template = "\n\n".join(
            [prefix, tool_strings, format_instructions, examples, suffix]
        )
        if input_variables is None:
            input_variables = ["input", "agent_scratchpad"]
        return PromptTemplate(template=template, input_variables=input_variables)
