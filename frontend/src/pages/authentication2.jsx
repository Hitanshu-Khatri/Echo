// import * as React from 'react';
// import Avatar from '@mui/material/Avatar';
// import Button from '@mui/material/Button';
// import CssBaseline from '@mui/material/CssBaseline';
// import TextField from '@mui/material/TextField';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Checkbox from '@mui/material/Checkbox';
// import Link from '@mui/material/Link';
// import Paper from '@mui/material/Paper';
// import Box from '@mui/material/Box';
// import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
// import Typography from '@mui/material/Typography';
// import { createTheme, ThemeProvider } from '@mui/material/styles';

// import { Snackbar } from '@mui/material';

// // TODO remove, this demo shouldn't need to reset the theme.

// const defaultTheme = createTheme();

// export default function xyz() {
//     const [username, setUsername] = React.useState();
//     const [password, setPassword] = React.useState();
//     const [name, setName] = React.useState();
//     const [error, setError] = React.useState();
//     const [message, setMessage] = React.useState();

//     const [formState, setFormState] = React.useState(0);

//     const [open, setOpen] = React.useState(false)

//     let handleAuth = async () => {
//         try {
//             if (formState === 0) {
//                 let result = await handleLogin(username, password)
//             }
//             if (formState === 1) {
//                 let result = await handleRegister(name, username, password);
//                 console.log(result);
//                 setUsername("");
//                 setMessage(result);
//                 setOpen(true);
//                 setError("")
//                 setFormState(0)
//                 setPassword("")
//             }
//         } catch (err) {
//             console.log(err);
//             let message = (err.response.data.message);
//             setError(message);
//         }
//     }

//     return (
//         <ThemeProvider theme={defaultTheme}>
//             <Box
//                 component="main"
//                 sx={{
//                     height: '100vh',
//                     display: 'grid',
//                     gridTemplateColumns: {
//                         xs: '1fr',
//                         sm: '1fr 2fr',
//                         md: '7fr 5fr'
//                     }
//                 }}
//             >
//                 <CssBaseline />
                
//                 {/* Background Image Section */}
//                 <Box
//                     sx={{
//                         display: { xs: 'none', sm: 'block' },
//                         backgroundImage: 'url(background.jpg)',
//                         backgroundRepeat: 'no-repeat',
//                         backgroundColor: (t) =>
//                             t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
//                         backgroundSize: '100%',
//                         backgroundPosition: 'center',
//                     }}
//                 />
                
//                 {/* Form Section */}
//                 <Paper elevation={6} square sx={{ display: 'flex', alignItems: 'center' }}>
//                     <Box
//                         sx={{
//                             my: 8,
//                             mx: 4,
//                             display: 'flex',
//                             flexDirection: 'column',
//                             alignItems: 'center',
//                             width: '100%'
//                         }}
//                     >
//                         <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
//                             <LockOutlinedIcon />
//                         </Avatar>

//                         <div>
//                             <Button variant={formState === 0 ? "contained" : ""} onClick={() => { setFormState(0) }}>
//                                 Sign In
//                             </Button>
//                             <Button variant={formState === 1 ? "contained" : ""} onClick={() => { setFormState(1) }}>
//                                 Sign Up
//                             </Button>
//                         </div>

//                         <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
//                             {formState === 1 ? <TextField
//                                 margin="normal"
//                                 required
//                                 fullWidth
//                                 id="fullname"
//                                 label="Full Name"
//                                 name="fullname"
//                                 value={name}
//                                 autoFocus
//                                 onChange={(e) => setName(e.target.value)}
//                             /> : <></>}

//                             <TextField
//                                 margin="normal"
//                                 required
//                                 fullWidth
//                                 id="username"
//                                 label="Username"
//                                 name="username"
//                                 value={username}
//                                 autoFocus
//                                 onChange={(e) => setUsername(e.target.value)}
//                             />
//                             <TextField
//                                 margin="normal"
//                                 required
//                                 fullWidth
//                                 name="password"
//                                 label="Password"
//                                 value={password}
//                                 type="password"
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 id="password"
//                             />

//                             <p style={{ color: "red" }}>{error}</p>

//                             <Button
//                                 type="button"
//                                 fullWidth
//                                 variant="contained"
//                                 sx={{ mt: 3, mb: 2 }}
//                                 onClick={handleAuth}
//                             >
//                                 {formState === 0 ? "Login " : "Register"}
//                             </Button>
//                         </Box>
//                     </Box>
//                 </Paper>
//             </Box>

//             <Snackbar
//                 open={open}
//                 autoHideDuration={4000}
//                 message={message}
//             />
//         </ThemeProvider>
//     );
// }