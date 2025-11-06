import React, { useContext, useMemo, useState } from "react";
import withAuth from "../utils/withAuth.jsx";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Grid } from "@mui/material";


// MUI
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  TextField,
  Container,
  Card,
  CardContent,
  CardActions,
  Box,
  InputAdornment,
  Tooltip,
  Paper,
  Snackbar,
  Alert,
  CssBaseline,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import VideocamIcon from "@mui/icons-material/Videocam";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";

function HomeComponent() {
  const navigate = useNavigate();
  const { addToUserHistory } = useContext(AuthContext);

  const [meetingCode, setMeetingCode] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, msg: "" });

  const isValid = useMemo(() => {
    // Allow letters, numbers, dashes/underscores, 4-20 chars
    const ok = /^[A-Za-z0-9_-]{4,20}$/.test(meetingCode);
    return ok;
  }, [meetingCode]);

  const handleJoinVideoCall = async () => {
    if (!isValid) {
      setError(
        meetingCode
          ? "Use 4-20 letters/numbers (dashes/underscores allowed)."
          : "Meeting code can’t be empty."
      );
      return;
    }
    try {
      await addToUserHistory(meetingCode);
      navigate(`/meet/${meetingCode}`);
    } catch (e) {
      setToast({ open: true, msg: "Couldn’t join. Try again." });
    }
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      handleJoinVideoCall();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <>
      <CssBaseline />
      {/* Top App Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "transparent",
          backdropFilter: "saturate(180%) blur(8px)",
          boxShadow: "none",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ minHeight: 72 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
            <Box
              component="span"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <VideocamIcon fontSize="small" />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 ,color:"black"}}>
              Echo
            </Typography>
          </Box>

          <Tooltip title="View meeting history">
            <IconButton onClick={() => navigate("/history")}
              aria-label="history"
              size="large"
            >
              <RestoreIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Logout">
            <Button
              variant="text"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleLogout}
              sx={{ ml: 1 }}
            >
              Logout
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: "calc(100dvh - 72px)",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.25), transparent 60%),
                 radial-gradient(800px 400px at 90% 30%, rgba(16,185,129,0.2), transparent 60%)`
              : `linear-gradient(180deg, #f8fafc 0%, #ffffff 40%)`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
           <Grid size={{ xs: 12, md: 6 }} order={{ xs: 1, md: 1 }}>
              <Box sx={{ maxWidth: 560 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2 }}>
                  Crystal‑clear video calls.
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
                  Join meetings instantly with a secure code. No clutter, just a fast and reliable experience.
                </Typography>

                <Card elevation={6} sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Enter meeting code"
                      placeholder="e.g. team-sync_1234"
                      value={meetingCode}
                      onChange={(e) => {
                        setMeetingCode(e.target.value.trim());
                        setError("");
                      }}
                      onKeyDown={handleEnter}
                      error={Boolean(error) || (!!meetingCode && !isValid)}
                      helperText={
                        error || (!!meetingCode && !isValid
                          ? "Use 4-20 letters/numbers (dashes/underscores allowed)."
                          : " ")
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <KeyRoundedIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      onClick={handleJoinVideoCall}
                      variant="contained"
                      size="large"
                      disableElevation
                      fullWidth
                      disabled={!isValid}
                    >
                      Join Meeting
                    </Button>
                  </CardActions>
                </Card>

                <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                  <Button onClick={() => navigate("/history")} variant="outlined">
                    View History
                  </Button>
                  <Button onClick={handleLogout} variant="text">
                    Logout
                  </Button>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }} order={{ xs: 2, md: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 4 },
                  borderRadius: 4,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                }}
              >
                <Box
                  component="img"
                  src="/logo3.png"
                  alt="Echo illustration"
                  sx={{ width: "100%", maxWidth: 520, display: "block", mx: "auto" }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast({ open: false, msg: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast({ open: false, msg: "" })} severity="error" variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default withAuth(HomeComponent);
