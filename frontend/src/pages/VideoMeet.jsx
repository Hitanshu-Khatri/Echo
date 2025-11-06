import React from "react"
import styles from "../styles/videoComponent.module.css"
import TextField from "@mui/material/TextField";
import { useRef, useState, useEffect } from "react";
import Button from "@mui/material/Button";
import io from "socket.io-client";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import MailIcon from '@mui/icons-material/Mail';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import ListItem from "@mui/material/ListItem";
const connections = {};
import { useNavigate } from "react-router-dom";
import { Box, Paper, Stack, Typography, InputAdornment } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import server from "../environment";

const iceCandidates = {};

const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
}

export default function VideoMeetComponent() {

  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(false);
  let [audioAvailable, setAudioAvailable] = useState(false);

  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();
  let [showModal, setShowModal] = useState(true);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(3);
  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([])

  let [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (userMediaStream) {
        setVideoAvailable(true);
        setAudioAvailable(true);

        window.localStream = userMediaStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStream;
        }
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

    } catch (err) {
      console.error('Error accessing media devices.', err);
      setVideoAvailable(false);
      setAudioAvailable(false);
      setScreenAvailable(false);
    }
  };

  useEffect(() => {
    getPermissions();
  }, [])

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue
      // Use addTrack instead of deprecated addStream
      if (connections[id].getSenders) {
        window.localStream.getTracks().forEach(track => {
          const sender = connections[id].getSenders().find(s => s.track && s.track.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            connections[id].addTrack(track, window.localStream);
          }
        });
      } else {
        connections[id].addStream(window.localStream);
      }
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
          })
          .catch(e => console.log(e))
      })
    }
  }

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }

  let black = (width = 640, height = 480) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

  let getUserMedia = async () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => { })
        .catch((e) => console.log(e))
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => {
          track.stop();
        })
      } catch (e) {
        console.log(e);
      }
    }
  }

  useEffect(() => {
    if (video !== undefined & audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video])

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message)
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId].createAnswer().then((description) => {
                connections[fromId].setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                  })
                  .catch(e => console.log(e))
              }).catch(e => console.log(e))
            }
          })
          .then(() => {
            if (iceCandidates[fromId]) {
              iceCandidates[fromId].forEach(candidate => {
                connections[fromId].addIceCandidate(new RTCIceCandidate(candidate));
              });
              iceCandidates[fromId] = [];
            }
          })
          .catch(e => {
            console.error("Error setting remote description:", e);
          })
      }
      if (signal.ice) {
        if (connections[fromId].remoteDescription) {
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => {
            console.error("Error adding ICE candidate:", e);
          })
        } else {
          if (!iceCandidates[fromId]) {
            iceCandidates[fromId] = [];
          }
          iceCandidates[fromId].push(signal.ice);
        }
      }
    }
  }

  let addMessage = (data,sender,socketIdSender) => {
    setMessages((prevMessages)=>[
      ...prevMessages,
      {sender:sender,data:data}
    ]);
    if(socketIdSender !== socketIdRef.current){
      setNewMessages((prevMessages)=> prevMessages+1)
    };
    }
  

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server, { secure: false });
    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('connect', () => {
      socketRef.current.emit("join-call", window.location.href)
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on('chat-message', addMessage)
      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => Array.isArray(videos) ? videos.filter((video) => video.socketId !== id) : []);
      })
      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {

          connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
          // Wait for their ice candidate       
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
            }
          }

          // Wait for their video stream
          connections[socketListId].ontrack = (event) => {
            setVideos(prevVideos => {
              let currentVideos = Array.isArray(prevVideos) ? [...prevVideos] : [];
              let videoForSocket = currentVideos.find(video => video.socketId === socketListId);

              if (videoForSocket) {
                // Video element already exists, add the new track to its stream
                videoForSocket.stream.addTrack(event.track);
                return currentVideos; // Return new array to trigger re-render
              } else {
                // New peer, create a new video element with the stream
                let newVideo = {
                  socketId: socketListId,
                  stream: event.streams[0],
                  autoplay: true,
                  playsinline: true
                };
                return [...currentVideos, newVideo];
              }
            });
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            if (connections[socketListId].addTrack) {
              window.localStream.getTracks().forEach(track => {
                connections[socketListId].addTrack(track, window.localStream);
              });
            } else {
              connections[socketListId].addStream(window.localStream);
            }
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            if (connections[socketListId].addTrack) {
              window.localStream.getTracks().forEach(track => {
                connections[socketListId].addTrack(track, window.localStream);
              });
            } else {
              connections[socketListId].addStream(window.localStream);
            }
          }
        })

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue

            try {
              if (connections[id2].addTrack) {
                window.localStream.getTracks().forEach(track => {
                  connections[id2].addTrack(track, window.localStream);
                });
              } else {
                connections[id2].addStream(window.localStream);
              }
            } catch (e) { /* empty */ }

            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                })
                .catch(e => console.log(e))
            })
          }
        }
      })
    });
  }

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  }

  let routeTo = useNavigate();


  let connect = () => {
    setAskForUsername(false);
    getMedia();
  }

  let handleVideo = () => {
    setVideo(!video);
  }
  let handleAudio = () => {
    setAudio(!audio);
  }

  let getDisplayMediaSuccess = (stream) => {
    try{
      window.localStream.getTracks().forEach(track => track.stop())
    }catch(e){
      console.log(e);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for(let id in connections){
      if(id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
        .then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
        })
        .catch(e => console.log(e))
      })
    }

     stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);


            try {
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoRef.current.srcObject = window.localStream

            getUserMedia();
        })
  }

  let getDisplayMedia = () => {
    if(screen){
      if(navigator.mediaDevices.getDisplayMedia){
        navigator.mediaDevices.getDisplayMedia({video: true,audio:true})
        .then(getDisplayMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e))
      }
      }
    }
  

  useEffect(()=>{
    if(screen!== undefined){
      getDisplayMedia();
    }
  },[screen])

  let handleScreen = () => {
    setScreen(!screen);
  }

  let sendMessage = () => {
      socketRef.current.emit("chat-message",message,username);
      setMessage("");
  
  }

  let handleEndCall = () => {
    try{
      let tracks = localVideoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }catch(e){
      console.log(e);
    }
    routeTo("/home");
    }
  
  let handleChat = () => {
    setShowModal(!showModal);
  }



  return (
    <div className="main">

      {askForUsername === true ?

        <Box className="lobbyenter">
  <Paper elevation={6} sx={{ p: 3, borderRadius: 3, maxWidth: 420, mx: "auto", mt: 4 }}>
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Enter the Lobby
      </Typography>

      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="e.g. wade_wilson"
        onKeyDown={(e) => e.key === "Enter" && username.trim() && connect()}
        helperText={!username.trim() ? "Please enter a username to continue." : " "}
        error={!username.trim()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon />
            </InputAdornment>
          ),
        }}
        fullWidth
      />

      <Button
        variant="contained"                  // note: fixed typo from 'varient'
        size="large"
        onClick={connect}
        startIcon={<LoginRoundedIcon />}
        disabled={!username.trim()}
        fullWidth
      >
        Connect
      </Button>
    </Stack>
  </Paper>

  <Box sx={{ mt: 3, maxWidth: 640, mx: "auto" }}>
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: "16 / 9",
        bgcolor: "grey.900",
      }}
    >
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </Box>
  </Box>
</Box>
 : <div className={styles.meetVideoContainer}>

          {showModal ? 
          <div className={styles.chatRoom}>
              

            <div className={styles.chatContainer}>
              <h1 style={{marginTop: 20,color:"black"}}>Chat</h1>
              <hr style={{marginBottom:"20px"}}></hr>
              <div className={styles.chattingDisplay}>


                {messages.map((item,index)=>{
                  return(
                    <div style={{marginBottom:"20px",color:"black"}} key={index}>
                      <p style={{fontWeight:"bold"}}>{item.sender}</p>
                      <p>{item.data}</p>
                    </div>
                  )
                })}
              </div>
              <div className={styles.chattingArea}>
                  <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                  <Button variant='contained' onClick={sendMessage}>Send</Button>
              </div>
            </div>


          </div>:<></>}


          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {(audio === true) ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable === true ?
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton> : <></>}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={handleChat} style={{ color: "white" }}>
                <MailIcon />
              </IconButton>
            </Badge>
          </div>

          <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div key={video.socketId} >
                <video className={styles.videoWrapper}
                  data-socket={video.socketId}
                  ref={ref => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                >
                </video>
              </div>
            ))}
          </div>
        </div>
      }
    </div>
  );
} 
