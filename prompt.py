from settings import OPENAI_SECRET_KEY
import openai
import pprint
import math

def prompt(x):
    return f"""
    Please finish the following sentence as succinctly as possible. Only give the single number, no other text or explanation. Omit the trailing period.

    On a scale of 1 to 10, with 1 being awful and 10 being great, {x} is/are a '
    """

openai.api_key = OPENAI_SECRET_KEY

def query(x, n = 100):
    d = {}

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{'role': 'user', 'content':  prompt(x)}],
        temperature=1,
        n=n)

    for choice in response['choices']:
        try:
            answer = float(choice['message']['content'])
            if math.isnan(answer):
                continue
            elif answer in d:
                d[answer] += 1
            else:
                d[answer] = 1
        except:
            print('not a number', choice['message']['content'])

    return { k: v / n for k, v in d.items() }
