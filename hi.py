import threading
import itertools
import time
import sys
import os
from dotenv import load_dotenv
import openai
from openai import AzureOpenAI

class Client(AzureOpenAI):
    def __init__(self)  -> None:
        '''
        This class is a wrapper for the OpenAI API client. It initializes the client and starts a spinner while the client is being initialized.
        I use this because I am lazy
        '''
        # Immediately start the spinner 
        self._stop_spinner = False
        self.spinner_thread = threading.Thread(target=self._spinner, daemon=True)
        self.spinner_thread.start()

        try:
           
            load_dotenv() 
            self._api_key = os.getenv("AZURE_OPENAI_API_KEY")
            self._api_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
            self._azure_deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
            self._version = os.getenv("AZURE_VERSION")
            self._base_url = f'{self._api_endpoint}/openai/deployments/{self._azure_deployment_name}/chat/completions?api-version={self._version}'

            super().__init__(
                api_key=self._api_key,
                api_version=self._version,
                base_url=self._base_url,
            )

            

        finally:
            # Stop the spinner once initialization is complete
            self._stop_spinner = True
            self.spinner_thread.join()

    def _spinner(self):
        '''Spinner function to run in a separate thread.'''
        for char in itertools.cycle('|/-\\'):
            if self._stop_spinner:
                break
            sys.stdout.write(f'\r{char} Connecting to API...')
            sys.stdout.flush()
            time.sleep(0.1)
        sys.stdout.write('\r' + ' ' * len('Connecting to API...') + '\r')
        sys.stdout.flush()
    # Getters for the class
    @property
    def azure_deployment_name(self):
        return self._azure_deployment_name

    @property
    def version(self):
        return self._version

    @property
    def base_url(self):
        return self._base_url    
    
    def test(self):
        # Test method to check if the client works
        try:
            response_test = self.chat.completions.create(
                model=self.azure_deployment_name,
                messages=[
                    {"role": "system", "content": "You are nice and friendly. You tell the user the API is working correctly."}, 
                    {"role": "user", "content": f"Greet the user with your name {self.azure_deployment_name} and tell them a nice compliment."},
                ]
            )
            print(response_test.choices[0].message.content)
        
        except openai.BadRequestError as e:
            print(f"Bad request: {e.message}")
        except openai.AuthenticationError as e:
            print(f"Authentication failure: {e.message}")
        except openai.PermissionDeniedError as e:
            print(f"Permission denied: {e.message}")
        except openai.NotFoundError as e:
            print(f"Resource not found: {e.message}")
        except openai.ConflictError as e:
            print(f"Conflict: {e.message}")
        except openai.UnprocessableEntityError as e:
            print(f"Unprocessable entity: {e.message}")
        except openai.RateLimitError as e:
            print(f"Rate limit: {e.message}")

# Usage
client = Client()
print(f'DEPLOYMENT MODEL: {client.azure_deployment_name}\nTEST:\n')
client.test()
