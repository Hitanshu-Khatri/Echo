import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Box,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Tooltip,
  Skeleton,
  Snackbar,
  Alert,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VideocamIcon from "@mui/icons-material/Videocam";
import HistoryIcon from "@mui/icons-material/History";
import { AuthContext } from "../contexts/AuthContext.jsx";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "info" });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const history = await getHistoryOfUser();
        if (!mounted) return;
        setMeetings(Array.isArray(history) ? history : []);
      } catch (error) {
        setToast({ open: true, msg: "Failed to load history.", severity: "error" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getHistoryOfUser]);

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => new Date(b?.date) - new Date(a?.date));
  }, [meetings]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ open: true, msg: "Meeting code copied", severity: "success" });
    } catch {
      setToast({ open: true, msg: "Copy failed", severity: "error" });
    }
  };

  const handleJoin = (code) => navigate(`/meet/${code}`);

  return (
    <>
      <AppBar position="sticky" elevation={0}
        sx={{
          background: (t) => t.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "#fff",
          color: "inherit",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
          backdropFilter: "saturate(180%) blur(8px)"
        }}>
        <Toolbar>
          <Tooltip title="Home">
            <IconButton edge="start" onClick={() => navigate("/home")} aria-label="home">
              <HomeIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, flexGrow: 1 }}>
            Meeting History
          </Typography>
          <Chip icon={<HistoryIcon />} label={`${meetings.length} total`} variant="outlined" />
        </Toolbar>
      </AppBar>

      <Box sx={{
        minHeight: "calc(100dvh - 64px)",
        background: (t) =>
          t.palette.mode === "dark"
            ? `radial-gradient(1200px 600px at 10% 10%, rgba(99,102,241,0.15), transparent 60%),
               radial-gradient(800px 400px at 90% 30%, rgba(16,185,129,0.12), transparent 60%)`
            : `linear-gradient(180deg, #f8fafc 0%, #ffffff 40%)`,
        pt: 3, pb: 6
      }}>
        <Container maxWidth="md">
          {/* Loading skeletons */}
          {loading && (
            <Stack spacing={2}>
              {[...Array(4)].map((_, i) => (
                <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={180} height={20} sx={{ mt: 1 }} />
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Skeleton width={100} height={36} />
                    <Skeleton width={100} height={36} />
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}

          {/* Empty state */}
          {!loading && sortedMeetings.length === 0 && (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  mx: "auto",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  mb: 2
                }}
              >
                <HistoryIcon />
              </Box>
              <Typography variant="h6" fontWeight={700}>No meetings yet</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.5 }}>
                Join a meeting and it’ll appear here.
              </Typography>
              <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/home")}>
                Go to Home
              </Button>
            </Box>
          )}

          {/* Meetings list */}
          {!loading && sortedMeetings.length > 0 && (
            <Stack spacing={2}>
              {sortedMeetings.map((e, i) => {
                const code = e?.meeting_code || e?.code || "—";
                const date = formatDate(e?.date);
                return (
                  <Card key={`${code}-${i}`} variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ pb: 1.5 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Code
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{code}</Typography>
                        <Tooltip title="Copy code">
                          <IconButton size="small" onClick={() => handleCopy(code)}>
                            <ContentCopyIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Date: {date}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<VideocamIcon />}
                        onClick={() => handleJoin(code)}
                      >
                        Join again
                      </Button>
                      <Button variant="text" onClick={() => navigate("/home")}>Home</Button>
                    </CardActions>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Container>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast({ open: false, msg: "", severity: "info" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
