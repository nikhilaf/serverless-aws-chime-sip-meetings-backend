# serverless-aws-chime-sip-meetings-backend


Prerequisites
--------------
- Install [AWS Command Line Interface](https://aws.amazon.com/cli/)
- Install [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Clone the repo
- Get permission to Amazon Chime Administration Console

Lambda deployment
------------------

- ```  npm i   ```
- ```  sam build   ```
- ```  sam deploy --guided   ```
- Use us-east-1 region in option while in deployment
- Take the endpoint URL.
- clone the [Frontend demo repo](https://github.com/WebRTCventures/simple-chime-frontend)
- Change the URL [here](https://github.com/WebRTCventures/simple-chime-frontend/blob/main/src/App.js#L165)
- ```  npm i   ```
- ```  npm start   ```
- check in the browser with ```    https://localhost:3000  ```
- Enter room name and test the meeting after setup s3 and sip media application.

S3 setup
--------
- Use us-east-1.
- Create a s3 bucket name sip-chime-audio-files.
- Copy all audio file from audio-file folder and past it in the s3bucket. or use
    ```
    aws s3 cp ./audio-file/ s3://<bucketName>/ --recursive --exclude "*" --include "*.wav" --no-guess-mime-type --content-type="audio/wav" 
    ```

Setting up the sip media application
------------------------------
- Use us-east-1.
- Goto aws chime sdk console and create sip media application using the ARN of the sip lambda function.
- Create a sip rule in media application and assign a phone number
- Dail to that number you will here in frontend application.


