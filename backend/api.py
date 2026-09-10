# ============================================================
# VAJRA | PC CLIENT
# ============================================================

import requests
import time

VAJRA_URL = "https://elmiest-julieta-unmelodramatically.ngrok-free.dev"
# AJRA_URL = "https://botany-caliber-dispute.ngrok-free.dev"

API_KEY = "VAJRA-2026-SECRET"


def ask_vajra(message):

    payload = {

        "messages": [

            {
                "role": "user",
                "content": message
            }

        ],

        "max_tokens": 1024,

        "temperature": 0.7
    }


    print("\n↑ Sending request...")

    start = time.time()


    response = requests.post(

        VAJRA_URL + "/api/chat",

        headers={
            "X-VAJRA-KEY": API_KEY
        },

        json=payload,

        timeout=300
    )


    response.raise_for_status()


    data = response.json()


    elapsed = time.time() - start


    answer = data[
        "choices"
    ][0][
        "message"
    ][
        "content"
    ]


    print(
        f"↓ Response received | {elapsed:.1f}s"
    )

    print("\nVAJRA:")
    print(answer)


# ============================================================
# CHAT
# ============================================================

print("⚡ VAJRA CLIENT")
print("Type 'exit' to quit.")

while True:

    message = input("\nYou: ")

    if message.lower() == "exit":
        break

    try:

        ask_vajra(message)

    except Exception as e:

        print(
            f"\n❌ {e}"
        )