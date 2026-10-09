/* =========================================================
   WINDOWS 98 DESKTOP INTERACTIVITY (SILENT / NO AUDIO)
   ========================================================= */

(function () {
  'use strict';

  // State
  let highestZ = 100;
  let activeWindow = null;

  // System Clock
  function updateClock() {
    const clockEl = document.getElementById('tray-clock');
    if (!clockEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    clockEl.textContent = `${hours}:${minutes} ${ampm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Dialog Helper
  function showDialog(message, icon = 'ℹ️') {
    const dialog = document.getElementById('dialog-box');
    const msgEl = document.getElementById('dialog-msg');
    const iconEl = dialog ? dialog.querySelector('.dialog-icon') : null;
    if (dialog && msgEl) {
      msgEl.textContent = message;
      if (iconEl) iconEl.textContent = icon;
      dialog.classList.remove('hidden');
    }
  }

  function hideDialog() {
    const dialog = document.getElementById('dialog-box');
    if (dialog) dialog.classList.add('hidden');
  }

  // Window Management
  const windows = Array.from(document.querySelectorAll('.window'));
  const taskbarTasks = document.getElementById('taskbar-tasks');

  function bringToFront(win) {
    if (!win) return;
    highestZ += 1;
    win.style.zIndex = highestZ;
    windows.forEach(w => w.classList.remove('active-window'));
    win.classList.add('active-window');
    activeWindow = win;
    updateTaskbar();
  }

  function openWindow(winId) {
    const win = document.getElementById(winId);
    if (!win) return;
    win.classList.remove('hidden');
    win.classList.remove('minimized');
    bringToFront(win);
    updateTaskbar();
  }

  function closeWindow(win) {
    if (!win) return;
    win.classList.add('hidden');
    if (win.id === 'win-player') {
      stopAudio();
    }
    updateTaskbar();
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add('minimized');
    win.classList.remove('active-window');
    updateTaskbar();
  }

  function toggleMaximize(win) {
    if (!win) return;
    if (win.dataset.maximized === 'true') {
      win.style.top = win.dataset.origTop || '40px';
      win.style.left = win.dataset.origLeft || '100px';
      win.style.width = win.dataset.origWidth || '440px';
      win.style.height = win.dataset.origHeight || 'auto';
      win.dataset.maximized = 'false';
    } else {
      win.dataset.origTop = win.style.top;
      win.dataset.origLeft = win.style.left;
      win.dataset.origWidth = win.style.width;
      win.dataset.origHeight = win.style.height;
      win.style.top = '0px';
      win.style.left = '0px';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 30px)';
      win.dataset.maximized = 'true';
    }
  }

  function updateTaskbar() {
    if (!taskbarTasks) return;
    taskbarTasks.innerHTML = '';

    windows.forEach(win => {
      if (win.classList.contains('hidden')) return;

      const titleText = win.querySelector('.title-bar-text')?.textContent.trim() || 'Window';
      const taskBtn = document.createElement('button');
      taskBtn.className = 'task-button';
      if (!win.classList.contains('minimized') && win.classList.contains('active-window')) {
        taskBtn.classList.add('active');
      }
      taskBtn.textContent = titleText;

      taskBtn.addEventListener('click', () => {
        if (win.classList.contains('minimized')) {
          win.classList.remove('minimized');
          bringToFront(win);
        } else if (win.classList.contains('active-window')) {
          minimizeWindow(win);
        } else {
          bringToFront(win);
        }
      });

      taskbarTasks.appendChild(taskBtn);
    });
  }

  // Draggable Windows (Touch and Mouse)
  windows.forEach(win => {
    const titleBar = win.querySelector('.title-bar');
    if (!titleBar) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('.title-bar-controls')) return;
      bringToFront(win);
      if (win.dataset.maximized === 'true') return;

      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      origLeft = parseInt(window.getComputedStyle(win).left, 10) || 0;
      origTop = parseInt(window.getComputedStyle(win).top, 10) || 0;

      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;

      let newLeft = origLeft + dx;
      let newTop = origTop + dy;

      newTop = Math.max(0, Math.min(window.innerHeight - 70, newTop));
      newLeft = Math.max(-win.offsetWidth + 80, Math.min(window.innerWidth - 80, newLeft));

      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    };

    const onPointerUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);
    };

    titleBar.addEventListener('mousedown', onPointerDown);
    titleBar.addEventListener('touchstart', onPointerDown, { passive: true });

    win.addEventListener('mousedown', () => bringToFront(win));
    win.addEventListener('touchstart', () => bringToFront(win), { passive: true });

    const btnClose = win.querySelector('.btn-close');
    const btnMin = win.querySelector('.btn-min');
    const btnMax = win.querySelector('.btn-max');

    if (btnClose) btnClose.addEventListener('click', (e) => { e.stopPropagation(); closeWindow(win); });
    if (btnMin) btnMin.addEventListener('click', (e) => { e.stopPropagation(); minimizeWindow(win); });
    if (btnMax) btnMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(win); });
  });

  // Desktop Icons Click / Double Click
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  desktopIcons.forEach(icon => {
    let clickTimeout = null;

    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      desktopIcons.forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');

      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
        const target = icon.getAttribute('data-target');
        if (target) openWindow(target);
      } else {
        clickTimeout = setTimeout(() => {
          clickTimeout = null;
          if (window.innerWidth <= 768) {
            const target = icon.getAttribute('data-target');
            if (target) openWindow(target);
          }
        }, 280);
      }
    });

    icon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const target = icon.getAttribute('data-target');
      if (target) openWindow(target);
    });
  });

  // Deselect icons when clicking desktop
  document.getElementById('desktop')?.addEventListener('click', () => {
    desktopIcons.forEach(i => i.classList.remove('selected'));
  });

  // Tab Strip Navigation (About Me Window)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      const tabs = btn.closest('.window-body').querySelectorAll('.tab-content');
      tabs.forEach(tab => {
        if (tab.id === targetTab) {
          tab.classList.remove('hidden');
        } else {
          tab.classList.add('hidden');
        }
      });
    });
  });

  // Dialog Close & OK buttons
  document.getElementById('btn-close-dialog')?.addEventListener('click', hideDialog);
  document.getElementById('btn-dialog-ok')?.addEventListener('click', hideDialog);

  // Empty Trash button Easter Egg
  document.getElementById('btn-empty-trash')?.addEventListener('click', () => {
    const container = document.querySelector('.trash-container');
    if (container) {
      container.innerHTML = '<p style="padding:10px; color:#666; font-style:italic;">The quiet you’re left with is just everything you pushed away.</p>';
    }
  });

  // Start Menu Toggle
  const startBtn = document.getElementById('start-button');
  const startMenu = document.getElementById('start-menu');

  if (startBtn && startMenu) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = startMenu.classList.contains('hidden');
      if (isHidden) {
        startMenu.classList.remove('hidden');
        startBtn.classList.add('active');
      } else {
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');
      }
    });

    document.addEventListener('click', (e) => {
      if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');
      }
    });

    // Start menu item actions
    startMenu.querySelectorAll('.menu-entry').forEach(entry => {
      entry.addEventListener('click', () => {
        const action = entry.getAttribute('data-action');
        startMenu.classList.add('hidden');
        startBtn.classList.remove('active');

        if (action === 'open-about') openWindow('win-about');
        if (action === 'open-links') openWindow('win-links');
        if (action === 'open-player') openWindow('win-player');
        if (action === 'open-readme') openWindow('win-readme');
        if (action === 'shutdown') {
          const shutdownDialog = document.getElementById('shutdown-dialog');
          if (shutdownDialog) {
            shutdownDialog.classList.remove('hidden');
          }

          // Automatically close after 1 second
          setTimeout(() => {
            try {
              window.open('', '_self', '');
              window.close();
            } catch (e) {}

            // If browser blocks closing directly (due to sandbox policy on direct tabs):
            const msgEl = document.getElementById('shutdown-prompt-msg');
            if (msgEl) {
              msgEl.textContent = 'byebye (click to close)';
            }
          }, 1000);
        }
      });
    });

    // Clicking the dialog also attempts to close the tab
    document.getElementById('shutdown-dialog')?.addEventListener('click', () => {
      try {
        window.open('', '_self', '');
        window.close();
      } catch (e) {}
    });
  }

  // =========================================================
  // AUDIO PLAYER (SUNFADED.MP3 - AUTO PLAY & LOOP)
  // Starts muted to guarantee instant autoplay in all browsers
  // =========================================================
  const audioPlayer = document.getElementById('audio-player') || new Audio('SUNFADED.mp3');
  audioPlayer.loop = true;
  audioPlayer.volume = 0.01; // 1% volume
  audioPlayer.muted = true;  // Muted initially so browsers allow instant autoplay without clicks

  const btnPlay = document.getElementById('btn-play');
  const btnStop = document.getElementById('btn-stop');
  const btnMute = document.getElementById('btn-mute');
  const muteIcon = document.getElementById('mute-icon');
  const muteText = document.getElementById('mute-text');
  const visualizer = document.getElementById('visualizer');
  const timeDisplay = document.getElementById('time-display');
  const seekBar = document.getElementById('seek-bar');
  const trackNameEl = document.getElementById('track-name');

  let isUserSeeking = false;

  function updateMuteUI() {
    if (!btnMute) return;
    if (audioPlayer.muted) {
      btnMute.classList.add('flashing-unmute');
      if (muteIcon) muteIcon.textContent = '🔇';
      if (muteText) muteText.textContent = 'Click to Unmute';
      if (trackNameEl) trackNameEl.textContent = 'Track: SUNFADED.mp3 [MUTED]';
    } else {
      btnMute.classList.remove('flashing-unmute');
      if (muteIcon) muteIcon.textContent = '🔈';
      if (muteText) muteText.textContent = '1%';
      if (trackNameEl) trackNameEl.textContent = 'Track: SUNFADED.mp3';
    }
  }

  function unmuteAudio() {
    if (audioPlayer.muted) {
      audioPlayer.muted = false;
      updateMuteUI();
    }
  }

  function toggleMute() {
    audioPlayer.muted = !audioPlayer.muted;
    updateMuteUI();
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updatePlayerUI() {
    const current = audioPlayer.currentTime || 0;
    const duration = audioPlayer.duration || 0;

    if (timeDisplay) {
      timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }

    if (seekBar && !isUserSeeking) {
      if (duration > 0) {
        seekBar.value = (current / duration) * 100;
      } else {
        seekBar.value = 0;
      }
    }
  }

  function playAudio() {
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (btnPlay) btnPlay.textContent = '❚❚ Pause';
        if (visualizer) visualizer.classList.add('playing');
      }).catch(() => {
        // Fallback if browser is extra restrictive
        if (btnPlay) btnPlay.textContent = '▶ Play';
        if (visualizer) visualizer.classList.remove('playing');
      });
    }
  }

  function pauseAudio() {
    audioPlayer.pause();
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
  }

  function stopAudio() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
    updatePlayerUI();
  }

  // Audio element events
  audioPlayer.addEventListener('play', () => {
    if (btnPlay) btnPlay.textContent = '❚❚ Pause';
    if (visualizer) visualizer.classList.add('playing');
  });

  audioPlayer.addEventListener('pause', () => {
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
  });

  audioPlayer.addEventListener('timeupdate', () => {
    updatePlayerUI();
  });

  audioPlayer.addEventListener('loadedmetadata', () => {
    updatePlayerUI();
  });

  audioPlayer.addEventListener('volumechange', () => {
    updateMuteUI();
  });

  // Play / Pause Toggle
  btnPlay?.addEventListener('click', () => {
    if (audioPlayer.paused) {
      unmuteAudio();
      playAudio();
    } else {
      pauseAudio();
    }
  });

  // Stop Button
  btnStop?.addEventListener('click', () => {
    stopAudio();
  });

  // Mute / Unmute Button
  btnMute?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMute();
    if (audioPlayer.paused) {
      playAudio();
    }
  });

  // Timeline Seeker
  if (seekBar) {
    seekBar.addEventListener('mousedown', () => { isUserSeeking = true; });
    seekBar.addEventListener('touchstart', () => { isUserSeeking = true; });

    seekBar.addEventListener('input', () => {
      isUserSeeking = true;
      if (audioPlayer.duration) {
        const seekTime = (seekBar.value / 100) * audioPlayer.duration;
        if (timeDisplay) {
          timeDisplay.textContent = `${formatTime(seekTime)} / ${formatTime(audioPlayer.duration)}`;
        }
      }
    });

    seekBar.addEventListener('change', () => {
      if (audioPlayer.duration) {
        audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
      }
      isUserSeeking = false;
      if (audioPlayer.paused) {
        playAudio();
      }
    });

    seekBar.addEventListener('mouseup', () => { isUserSeeking = false; });
    seekBar.addEventListener('touchend', () => { isUserSeeking = false; });
  }

  // Start playing immediately on render (browser allows muted autoplay without clicks)
  playAudio();
  updateMuteUI();

  // Initial Window state (all 3 non-overlapping windows open on load)
  bringToFront(document.getElementById('win-about'));
  bringToFront(document.getElementById('win-links'));
  bringToFront(document.getElementById('win-player'));
  updateTaskbar();
})();
