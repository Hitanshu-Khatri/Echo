import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import server from "../environment";

// UI Components
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Badge,
  Paper,
  Stack,
  InputAdornment,
  Grid,
  Drawer,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Container,
  Divider,
  Tooltip,
  AppBar,
  Toolbar
} from "@mui/material";

// Icons
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  LoginRounded as LoginRoundedIcon,
  Send as SendIcon,
} from "@mui/icons-material";


const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8ab4f8" }, 
    background: { default: "#202124", paper: "#303134" },
    error: { main: "#ea4335" },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 24, textTransform: "none", fontWeight: 600 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
  },
});

const connections = {};
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
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

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

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1)
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
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

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
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => { })
          .catch((e) => console.log(e))
      }
    }
  }


  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])

  let handleScreen = () => {
    setScreen(!screen);
  }

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

  }

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    } catch (e) {
      console.log(e);
    }
    routeTo("/home");
  }

  let handleChat = () => {
    setShowModal(!showModal);
  }

  // =================================================================
  //  UI RENDER START (Modified for better UI, same Logic)
  // =================================================================

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      
      {askForUsername === true ? (
        // --- LOBBY UI ---
        <Container maxWidth="sm" sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Paper elevation={10} sx={{ p: 4, borderRadius: 4, width: "100%", textAlign: "center", backdropFilter: "blur(10px)", backgroundColor: "rgba(48, 49, 52, 0.95)" }}>
            <Stack spacing={3}>
              <Typography variant="h4" fontWeight={700}>Join Meeting</Typography>
              
              <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 3, overflow: "hidden", bgcolor: "black" }}>
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>

              <TextField
                label="Enter Display Name"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && username.trim() && connect()}
                placeholder="e.g. John Doe"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={connect}
                disabled={!username.trim()}
                startIcon={<LoginRoundedIcon />}
                fullWidth
                sx={{ height: 48 }}
              >
                Connect
              </Button>
            </Stack>
          </Paper>
        </Container>
      ) : (
        // --- VIDEO ROOM UI ---
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#202124", overflow: "hidden" }}>
          
          {/* Main Video Area */}
          <Box sx={{ flex: 1, p: 2, display: "flex", position: "relative", overflow: "hidden" }}>
            <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ height: "100%", width: "100%" }}>
              
              {/* Local Video */}
              <Grid item xs={12} md={videos.length > 0 ? 4 : 8} sx={{ height: videos.length === 0 ? "80%" : "auto" }}>
                <Paper elevation={4} sx={{ position: "relative", borderRadius: 3, overflow: "hidden", bgcolor: "black", aspectRatio: "16/9", width: "100%", height: "100%" }}>
                  <video ref={localVideoRef} autoPlay muted style={{ width: "100%", height: "100%", objectFit: "cover" }}></video>
                  <Box sx={{ position: "absolute", bottom: 10, left: 10, bgcolor: "rgba(0,0,0,0.6)", px: 1, borderRadius: 1 }}>
                    <Typography variant="caption" color="white">You</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Remote Videos */}
              {videos.map((video) => (
                <Grid item key={video.socketId} xs={12} md={4}>
                  <Paper elevation={4} sx={{ position: "relative", borderRadius: 3, overflow: "hidden", bgcolor: "black", aspectRatio: "16/9", width: "100%" }}>
                    <video
                      data-socket={video.socketId}
                      ref={ref => {
                        if (ref && video.stream) {
                          ref.srcObject = video.stream;
                        }
                      }}
                      autoPlay
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Floating Control Bar */}
          <AppBar position="fixed" color="transparent" sx={{ top: "auto", bottom: 0, boxShadow: "none", alignItems: "center", pb: 3, pointerEvents: "none" }}>
            <Toolbar sx={{ 
              bgcolor: "rgba(60, 64, 67, 0.9)", 
              borderRadius: 8, 
              pointerEvents: "auto", 
              gap: 1, 
              boxShadow: "0px 4px 24px rgba(0,0,0,0.4)" 
            }}>
              
              <Tooltip title="Toggle Video">
                <IconButton onClick={handleVideo} sx={{ bgcolor: video ? "transparent" : "#ea4335", color: "white", "&:hover": { bgcolor: video ? "rgba(255,255,255,0.1)" : "#d93025" } }}>
                  {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Toggle Audio">
                <IconButton onClick={handleAudio} sx={{ bgcolor: audio ? "transparent" : "#ea4335", color: "white", "&:hover": { bgcolor: audio ? "rgba(255,255,255,0.1)" : "#d93025" } }}>
                  {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </Tooltip>

              {screenAvailable && (
                <Tooltip title="Share Screen">
                  <IconButton onClick={handleScreen} sx={{ color: screen ? "#8ab4f8" : "white" }}>
                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="End Call">
                <Button variant="contained" color="error" onClick={handleEndCall} sx={{ borderRadius: 8, px: 3, mx: 1 }}>
                  <CallEndIcon />
                </Button>
              </Tooltip>

              <Tooltip title="Chat">
                <IconButton onClick={handleChat} sx={{ color: showModal ? "#8ab4f8" : "white" }}>
                  <Badge badgeContent={newMessages} color="secondary">
                    <ChatIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

            </Toolbar>
          </AppBar>

          {/* Chat Drawer (Replaced Modal) */}
          <Drawer
            anchor="right"
            open={showModal}
            onClose={handleChat} // Clicking outside closes it
            variant="persistent" // Keeps it open without blocking interaction
            sx={{
              "& .MuiDrawer-paper": {
                width: 320,
                bgcolor: "#202124",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
                pb: 10 // Make space for the bottom bar if needed
              },
            }}
          >
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <Typography variant="h6">In-call Messages</Typography>
              <IconButton onClick={handleChat}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ flex: 1, p: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {messages.length === 0 && <Typography variant="body2" color="text.secondary" align="center">No messages yet</Typography>}
              {messages.map((item, index) => {
                 const isMe = item.sender === username;
                 return (
                  <Box key={index} sx={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>{item.sender}</Typography>
                    <Paper sx={{ 
                      p: 1.5, 
                      bgcolor: isMe ? "#8ab4f8" : "#3c4043", 
                      color: isMe ? "#202124" : "white",
                      borderRadius: 2,
                      borderTopRightRadius: isMe ? 0 : 2,
                      borderTopLeftRadius: !isMe ? 0 : 2
                    }}>
                      <Typography variant="body2">{item.data}</Typography>
                    </Paper>
                  </Box>
                 )
              })}
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                placeholder="Send a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={sendMessage} edge="end" color="primary">
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Drawer>

        </Box>
      )}
    </ThemeProvider>
  );
}