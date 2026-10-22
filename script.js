/* =========================================================
   BIMBOWS 98 DESKTOP INTERACTIVITY (SILENT / NO AUDIO)
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
      win.style.top = win.dataset.origTop !== undefined ? win.dataset.origTop : '';
      win.style.left = win.dataset.origLeft !== undefined ? win.dataset.origLeft : '';
      win.style.width = win.dataset.origWidth !== undefined ? win.dataset.origWidth : '';
      win.style.height = win.dataset.origHeight !== undefined ? win.dataset.origHeight : '';
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
  const trashMessages = [
    "The quiet you’re left with is just everything you pushed away.",
    "All Empty!!!",
    "The strange thing about emptiness is how heavily it settles.",
    "All Clear!",
    "Funny how carefully a void gets built, one quiet choice at a time.",
    "Nothing here!",
    "What's even left to say when you feel nothing inside."
  ];
  let trashClickIndex = 0;
  let trashAudioTimeout = null;
  let trashFirstClickDone = false;

  document.getElementById('btn-empty-trash')?.addEventListener('click', () => {
    // If paused from the first click and button is pressed again early to see subsequent messages
    if (trashAudioTimeout) {
      clearTimeout(trashAudioTimeout);
      trashAudioTimeout = null;
      playAudio();
    } else if (!trashFirstClickDone) {
      trashFirstClickDone = true;
      if (!audioPlayer.paused) {
        pauseAudio();
        trashAudioTimeout = setTimeout(() => {
          trashAudioTimeout = null;
          playAudio();
        }, 3000);
      }
    }

    const container = document.querySelector('.trash-container');
    if (container) {
      const msg = trashMessages[trashClickIndex % trashMessages.length];
      trashClickIndex++;
      container.innerHTML = `<p style="padding:10px; color:#666; font-style:italic;">${msg}</p>`;
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
  // AUDIO PLAYER (SUNFADED.MP3 - AUTO PLAY & LOOP + REAL SPECTRUM)
  // Starts muted to guarantee instant autoplay in all browsers
  // =========================================================
  const audioPlayer = document.getElementById('audio-player') || new Audio('SUNFADED.mp3');
  const TARGET_VOLUME = 0.01; // 1% volume
  let isMuted = true;

  audioPlayer.loop = true;
  audioPlayer.volume = TARGET_VOLUME;
  audioPlayer.muted = true;  // Muted initially so browsers allow instant autoplay without clicks

  const btnPlay = document.getElementById('btn-play');
  const btnStop = document.getElementById('btn-stop');
  const btnMute = document.getElementById('btn-mute');
  const muteIcon = document.getElementById('mute-icon');
  const muteText = document.getElementById('mute-text');
  const visualizer = document.getElementById('visualizer');
  const visualizerBars = visualizer ? Array.from(visualizer.querySelectorAll('.bar')) : [];
  const timeDisplay = document.getElementById('time-display');
  const seekBar = document.getElementById('seek-bar');
  const trackNameEl = document.getElementById('track-name');

  let isUserSeeking = false;

  // Web Audio API Spectrum Analyser State
  let audioCtx = null;
  let analyser = null;
  let gainNode = null;
  let freqData = null;
  let spectrumRafId = null;
  const binMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        freqData = new Uint8Array(analyser.frequencyBinCount);

        gainNode = audioCtx.createGain();
        gainNode.gain.value = isMuted ? 0 : TARGET_VOLUME;

        const source = audioCtx.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Let gainNode handle the 1% volume & mute so AnalyserNode receives full signal
        audioPlayer.volume = 1.0;
        audioPlayer.muted = false;
      } catch (e) {
        audioCtx = null;
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function renderSpectrum() {
    if (audioPlayer.paused) {
      spectrumRafId = null;
      visualizerBars.forEach(bar => { bar.style.height = '15%'; });
      return;
    }

    if (analyser && freqData && audioCtx && audioCtx.state === 'running') {
      analyser.getByteFrequencyData(freqData);
      let hasSignal = false;
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > 0) {
          hasSignal = true;
          break;
        }
      }

      if (hasSignal && visualizer) {
        visualizer.classList.add('spectrum-active');
        visualizerBars.forEach((bar, idx) => {
          const bin = binMap[idx] !== undefined ? binMap[idx] : idx;
          const boost = 1 + idx * 0.04;
          const normalized = Math.min(1, (freqData[bin] / 255) * boost);
          const heightPct = Math.max(10, Math.round(normalized * 98));
          bar.style.height = `${heightPct}%`;
        });
      }
    }

    spectrumRafId = requestAnimationFrame(renderSpectrum);
  }

  function startSpectrumLoop() {
    if (!spectrumRafId) {
      spectrumRafId = requestAnimationFrame(renderSpectrum);
    }
  }

  function stopSpectrumLoop() {
    if (spectrumRafId) {
      cancelAnimationFrame(spectrumRafId);
      spectrumRafId = null;
    }
    visualizerBars.forEach(bar => { bar.style.height = '15%'; });
  }

  // Unlock AudioContext on first user interaction anywhere on the page
  const unlockOnGesture = () => {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'running') {
      document.removeEventListener('click', unlockOnGesture);
      document.removeEventListener('keydown', unlockOnGesture);
    }
  };
  document.addEventListener('click', unlockOnGesture);
  document.addEventListener('keydown', unlockOnGesture);

  function syncAudioGain() {
    if (gainNode && audioCtx) {
      gainNode.gain.value = isMuted ? 0 : TARGET_VOLUME;
      audioPlayer.muted = false;
      audioPlayer.volume = 1.0;
    } else {
      audioPlayer.muted = isMuted;
      audioPlayer.volume = TARGET_VOLUME;
    }
  }

  function updateMuteUI() {
    if (!btnMute) return;
    if (isMuted) {
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
    initAudioContext();
    if (isMuted) {
      isMuted = false;
      syncAudioGain();
      updateMuteUI();
    }
  }

  function toggleMute() {
    initAudioContext();
    isMuted = !isMuted;
    syncAudioGain();
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
        startSpectrumLoop();
      }).catch(() => {
        // Fallback if browser is extra restrictive
        if (btnPlay) btnPlay.textContent = '▶ Play';
        if (visualizer) visualizer.classList.remove('playing');
        stopSpectrumLoop();
      });
    }
  }

  function pauseAudio() {
    audioPlayer.pause();
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
    stopSpectrumLoop();
  }

  function stopAudio() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
    stopSpectrumLoop();
    updatePlayerUI();
  }

  // Audio element events
  audioPlayer.addEventListener('play', () => {
    if (btnPlay) btnPlay.textContent = '❚❚ Pause';
    if (visualizer) visualizer.classList.add('playing');
    startSpectrumLoop();
  });

  audioPlayer.addEventListener('pause', () => {
    if (btnPlay) btnPlay.textContent = '▶ Play';
    if (visualizer) visualizer.classList.remove('playing');
    stopSpectrumLoop();
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
    if (trashAudioTimeout) {
      clearTimeout(trashAudioTimeout);
      trashAudioTimeout = null;
    }
    if (audioPlayer.paused) {
      unmuteAudio();
      playAudio();
    } else {
      pauseAudio();
    }
  });

  // Stop Button
  btnStop?.addEventListener('click', () => {
    if (trashAudioTimeout) {
      clearTimeout(trashAudioTimeout);
      trashAudioTimeout = null;
    }
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

  // Window initialization and responsive behavior
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    // Phone view: no need to open the music app in this state
    const winPlayer = document.getElementById('win-player');
    if (winPlayer) {
      winPlayer.classList.add('hidden');
    }
    // Avoid overlapping as much as possible with Profile above and Links below
    bringToFront(document.getElementById('win-links'));
    bringToFront(document.getElementById('win-about'));
  } else {
    // Desktop: start muted autoplay and open all 3 windows side-by-side
    playAudio();
    updateMuteUI();
    bringToFront(document.getElementById('win-about'));
    bringToFront(document.getElementById('win-links'));
    bringToFront(document.getElementById('win-player'));
  }
  updateTaskbar();
})();
