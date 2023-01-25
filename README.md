# serverless-aws-chime-sip-meetings-backend


Prerequisites
--------------
- Install [AWS Command Line Interface](https://aws.amazon.com/cli/)
- Clone the repo
- Get permission to Amazon Chime Administration Console
- Install [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

Lambda deployment
------------------

1. ```  npm i   ```
2. ```  sam build   ```
3. ```  sam deploy --guided   ```
4. Use us-east-1 region in option while in deployment
5. Take the endpoint URL and use in the below front end repo https://github.com/WebRTCventures/simple-chime-frontend
6. Change the URL here https://github.com/WebRTCventures/simple-chime-frontend/blob/main/src/App.js#L165
7. Test the application after setup s3 and sip media application.

S3 setup
--------
1. Use us-east-1.
2. Create a s3 bucket name sip-chime-audio-files.
3. Copy all audio file from audio-file folder and past it in the s3bucket. or use
    ```
    aws s3 cp ./audio-file/ s3://<bucketName>/ --recursive --exclude "*" --include "*.wav" --no-guess-mime-type --content-type="audio/wav" 
    ```

Setting up the sip media application
------------------------------
Use us-east-1.
1. Goto aws chime sdk console and create sip media application using the ARN of the sip lambda function.
2. Create a sip rule in media application and assign a phone number
3. Dail to that number you will here in frontend application.


