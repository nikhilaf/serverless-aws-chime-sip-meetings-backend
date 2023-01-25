const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

const externalMeetingId = "sipmeeting";

const chime = new AWS.Chime({ region: 'us-east-1'});
//Setting the AWS chime endpoint, The global endpoint is https://service.chime.aws.amazon.com.
chime.endpoint = new AWS.Endpoint('https://service.chime.aws.amazon.com');

exports.start = async (event, context, callback) => {
    const query = event.queryStringParameters;
   // Retrieve Meetings list
   const meetingsResult = await chime.listMeetings().promise();

   // Finding a Meeting with a specific “external id” 
   const foundMeeting = Array.from(meetingsResult.Meetings).find(
     (it) => it.ExternalMeetingId === query.room
   );

   // If not, create a new Meeting info.
   const createdMeetingResponse =
     !foundMeeting &&
     (await chime
       .createMeeting({
         ClientRequestToken: uuidv4(),
         MediaRegion: "us-east-1",
         ExternalMeetingId: query.room,
       })
       .promise());

   // … or use the found meeting data.
   const meetingResponse = foundMeeting
     ? { Meeting: foundMeeting }
     : createdMeetingResponse;

   // Create Attendee info using the existing Meeting info.
   const attendeeResponse = await chime
     .createAttendee({
       MeetingId: meetingResponse.Meeting.MeetingId,
       ExternalUserId: uuidv4(), // Link the attendee to an identity managed by your application.
     })
     .promise();

    return {
        statusCode : 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            attendeeResponse,
            meetingResponse,
          }),
    }
 };

 exports.sip = async(event, context, callback) => {
    let actions = [];

    switch (event.InvocationEventType) {
        case "NEW_INBOUND_CALL":
            // New inbound call
            actions = await newCall(event);
            break;

        case "ACTION_SUCCESSFUL":
            // Action from the previous invocation response 
            // or a action requiring callback was successful
            actions = await actionSuccessful(event);
            break;

        case "HANGUP":
            // Hangup received
            actions = [];
            break;

        default:
            // Action unsuccessful or unknown event recieved
            actions = [];
    }

    const response = {
        "SchemaVersion": "1.0",
        "Actions": actions
    };

    callback(null, response);
}

// New call handler
async function newCall(event) {
  // Play a welcome message after answering the call, play a prompt and gather DTMF tones
  playAudioAction.Parameters.AudioSource.Key = "welcome_message.wav";
  return [pauseAction, playAudioAction, playAudioAndGetDigitsAction];
}

// Action successful handler
async function actionSuccessful(event) {
  
  const fromNumber = event.CallDetails.Participants[0].From;
  const callId = event.CallDetails.Participants[0].CallId;
  
  switch (event.ActionData.Type) {
      case "PlayAudioAndGetDigits":
          // Last action was PlayAudioAndGetDigits
          
          // With this inputs we need to get meeting details
          const meetingId = event.ActionData.ReceivedDigits;

          // Here we are using hardcoded meeting with external meeting id.
          // Retrieve Meetings list
          const meetingsResult = await chime.listMeetings().promise();

          // Can find a Meeting with a specific “external id”.
          const meeting = Array.from(meetingsResult.Meetings).find(
            (it) => it.ExternalMeetingId === externalMeetingId
          );

          // Get/create attendee
          const attendee = await chime.createAttendee({ MeetingId: meeting.MeetingId, ExternalUserId: fromNumber }).promise();

          // Return join meeting action to bridge user to meeting
          joinChimeMeetingAction.Parameters.JoinToken = attendee.Attendee.JoinToken;
          return [joinChimeMeetingAction];

      case "JoinChimeMeeting":
          // Last action was JoinChimeMeeting

          // Play meeting joined and register for dtmf
          playAudioAction.Parameters.AudioSource.Key = "meeting_joined.wav";
          return [receiveDigitsAction, playAudioAction];
          
      case "PlayAudio":
          return [];
          
      case "ReceiveDigits":
          return [];

      default:
          return [playAudioAndGetDigitsAction];
  }
}


// dail actions
const pauseAction = {
  "Type": "Pause",
  "Parameters": {
      "DurationInMilliseconds": "1000"
  }
};

const playAudioAction = {
  "Type": "PlayAudio",
  "Parameters": {
      "ParticipantTag": "LEG-A",
      "AudioSource": {
          "Type": "S3",
          "BucketName": process.env.BUCKET_NAME,
          "Key": ""
      }
  }
};

const playAudioAndGetDigitsAction = {
  "Type": "PlayAudioAndGetDigits",
  "Parameters": {
      "MinNumberOfDigits": 5,
      "MaxNumberOfDigits": 5,
      "Repeat": 3,
      "InBetweenDigitsDurationInMilliseconds": 1000,
      "RepeatDurationInMilliseconds": 5000,
      "TerminatorDigits": ["#"],
      "AudioSource": {
          "Type": "S3",
          "BucketName": process.env.BUCKET_NAME,
          "Key": "meeting_pin.wav"
      },
      "FailureAudioSource": {
          "Type": "S3",
          "BucketName": process.env.BUCKET_NAME,
          "Key": "meeting_pin.wav"
      }
  }
};

const joinChimeMeetingAction = {
  "Type": "JoinChimeMeeting",
  "Parameters": {
      "AttendeeJoinToken": ""
  }
};

const receiveDigitsAction = {
  "Type": "ReceiveDigits",
  "Parameters": {
      "InputDigitsRegex": "^\\*\\d{1}$",
      "InBetweenDigitsDurationInMilliseconds": 1000,
      "FlushDigitsDurationInMilliseconds": 10000
  }
};