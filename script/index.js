const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

const sounds = [
    'music/MS_lofi/MS_lofi_Melody.mp3', 'music/MS_lofi/MS_lofi_Bell.mp3', 'music/MS_lofi/MS_lofi_Rain.mp3', 'music/MS_lofi/MS_lofi_Kick.mp3', 'music/MS_lofi/MS_lofi_Clap.mp3', 'music/MS_lofi/MS_lofi_HiHat.mp3', 'music/MS_lofi/MS_lofi_Rim.mp3',
    'music/MS_trap/MS_trap_Melody.mp3', 'music/MS_trap/MS_trap_808.mp3', 'music/MS_trap/MS_trap_Kick.mp3', 'music/MS_trap/MS_trap_Clap.mp3', 'music/MS_trap/MS_trap_HiHat.mp3', 'music/MS_trap/MS_trap_OpenHat.mp3', 'music/MS_trap/MS_trap_Perc.mp3',
    'music/MS_pop/MS_pop_Melody.mp3', 'music/MS_pop/MS_pop_Bell.mp3', 'music/MS_pop/MS_pop_Pad.mp3', 'music/MS_pop/MS_pop_Bass.mp3', 'music/MS_pop/MS_pop_Kick.mp3', 'music/MS_pop/MS_pop_Clap.mp3', 'music/MS_pop/MS_pop_HiHat.mp3', 'music/MS_pop/MS_pop_Snap.mp3',

    'music/FE_lofi/FE_lofi_Melody.mp3', 'music/FE_lofi/FE_lofi_Rain.mp3', 'music/FE_lofi/FE_lofi_Kick.mp3', 'music/FE_lofi/FE_lofi_Clap.mp3', 'music/FE_lofi/FE_lofi_HiHat.mp3', 'music/FE_lofi/FE_lofi_OpenHat.mp3',
    'music/FE_trap/FE_trap_Melody.mp3', 'music/FE_trap/FE_trap_808.mp3', 'music/FE_trap/FE_trap_Kick.mp3', 'music/FE_trap/FE_trap_Clap.mp3', 'music/FE_trap/FE_trap_HiHat.mp3', 'music/FE_trap/FE_trap_Crash.mp3', 'music/FE_trap/FE_trap_Snare.mp3',
    'music/FE_pop/FE_pop_Piano.mp3', 'music/FE_pop/FE_pop_Pluck.mp3', 'music/FE_pop/FE_pop_Strings.mp3', 'music/FE_pop/FE_pop_Bass.mp3', 'music/FE_pop/FE_pop_Kick.mp3', 'music/FE_pop/FE_pop_Clap.mp3', 'music/FE_pop/FE_pop_HiHat.mp3', 'music/FE_pop/FE_pop_Rim.mp3', 'music/FE_pop/FE_pop_Snare.mp3'
];

const levels = [0, 0, -3, -10];
const loops = [];
const activeLoops = new Set();
let loopStartTime = 0;
const fadeTime = 0.050;

window.addEventListener('mousedown', onButton); //click
window.addEventListener('touchstart', onButton); //touch

loadLoops();

class Loop {
    constructor(buffer, button, level = 0) {
        this.buffer = buffer;
        this.button = button;
        this.amp = decibelToLinear(level);
        this.gain = null;
        this.source = null;
        this.analyser = null;
    }

    start(time, sync = true) {
        const buffer = this.buffer;
        let analyser = this.analyser;
        let offset = 0;

        if (analyser === null) {
            analyser = audioContext.createAnalyser();
            this.analyser = analyser;
            this.analyserArray = new Float32Array(analyser.fftSize);
        }

        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.connect(analyser);

        if (sync) {
            // fade in only when starting somewhere in the middle
            gain.gain.value = 0;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(this.amp, time + fadeTime);

            // set offset to loop time
            offset = (time - loopStartTime) % buffer.duration;
        }

        const source = audioContext.createBufferSource();
        source.connect(gain);
        source.buffer = buffer;
        source.loop = true;
        source.start(time, offset);

        this.source = source;
        this.gain = gain;

        activeLoops.add(this);
        this.button.classList.add('active');
        this.button.style.opacity = 0.25;
    }

    stop(time) {
        this.source.stop(time + fadeTime);
        this.gain.gain.setValueAtTime(this.amp, time);
        this.gain.gain.linearRampToValueAtTime(0, time + fadeTime);

        this.source = null;
        this.gain = null;

        activeLoops.delete(this);
        this.button.classList.remove('active');
        this.button.style.opacity = null;
    }

    get isPlaying() {
        return (this.source !== null);
    }
}

function loadLoops() {
    const decodeContext = new AudioContext();
    // load audio buffers
    for (let i = 0; i < sounds.length; i++) {
        const request = new XMLHttpRequest();
        request.responseType = 'arraybuffer';
        request.open('GET', sounds[i]);
        request.addEventListener('load', () => {
            decodeContext.decodeAudioData(request.response, (buffer) => {
                const button = document.querySelector(`button.button[data-index="${i}"]`);
                loops[i] = new Loop(buffer, button, levels[i])
            });
        });
        request.send();
    }
}

function onButton(evt) {
    const target = evt.target;
    const index = target.dataset.index;
    const loop = loops[index];

    if (audioContext === null)
        audioContext = new AudioContext();

    if (loop) {
        const time = audioContext.currentTime;
        let syncLoopPhase = true;

        if (activeLoops.size === 0) {
            loopStartTime = time;
        }

        if (!loop.isPlaying) {
            loop.start(time, syncLoopPhase);
        } else {
            loop.stop(time);
        }
    }
}

function decibelToLinear(val) {
    return Math.exp(0.11512925464970229 * val); // pow(10, val / 20)
}

//Alle Rechte des Codes liegen bei https://github.com/NorbertSchnell
