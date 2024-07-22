let trackingData = [];
let interval;
let isTracking = false;
let currentStartTime;

const timerElement = document.getElementById("timer");
const messageElement = document.getElementById("message");
const messageText = document.getElementById("messageText");
const okButton = document.getElementById("okButton");
const workTask = document.getElementById("workTask");
const trackButton = document.getElementById("track");
const addManualButton = document.getElementById("addManual");
const manualForm = document.getElementById("manualForm");
const pastTrackings = document.getElementById("pastTrackings");
const analyticsSection = document.getElementById("analyticsSection");
const viewSelector = document.getElementById("viewSelector");
const trackingChartElement = document.getElementById("trackingChart");
const goToAnalytics = document.getElementById("goToAnalytics");

let trackingChart;

// Function to format time
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Timer functionality
function startTimer() {
  currentStartTime = new Date();
  interval = setInterval(() => {
    const elapsedTime = Math.floor((new Date() - currentStartTime) / 1000);
    timerElement.textContent = formatTime(elapsedTime);
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  timerElement.textContent = "00:00:00"; // Reset timer display
}

// Start/Stop tracking button
trackButton.addEventListener("click", () => {
  if (!isTracking) {
    const taskName = workTask.value.trim();
    if (!taskName) {
      showMessage("Please enter a task name.");
      return;
    }
    startTimer();
    isTracking = true;
    trackButton.textContent = "Stop";
    trackingData.push({
      task: taskName,
      startTime: new Date(),
      elapsedTime: 0,
    });
    saveToLocalStorage();
    workTask.value = "";
  } else {
    stopTimer();
    isTracking = false;
    trackButton.textContent = "Start";
    const endTime = new Date();
    const elapsedTime = Math.floor((endTime - currentStartTime) / 1000);
    trackingData[trackingData.length - 1].elapsedTime = elapsedTime;
    addPastTracking(trackingData[trackingData.length - 1]);
    updateChart();
    saveToLocalStorage();
  }
});

// Show message
function showMessage(message) {
  messageText.textContent = message;
  messageElement.style.display = "block";
}

okButton.addEventListener("click", () => {
  messageElement.style.display = "none";
});

// Add manual task button
addManualButton.addEventListener("click", () => {
  manualForm.style.display = "block";
});

// Add manual task form
const manualTask = document.getElementById("manualTask");
const manualStartTime = document.getElementById("manualStartTime");
const manualEndTime = document.getElementById("manualEndTime");
const addManualButtonInForm = document.getElementById("addManualButton");
const cancelManualButton = document.getElementById("cancelManualButton");

addManualButtonInForm.addEventListener("click", () => {
  const taskName = manualTask.value.trim();
  const startTime = new Date(manualStartTime.value);
  const endTime = new Date(manualEndTime.value);

  if (!taskName || !startTime || !endTime || startTime >= endTime) {
    showMessage("Please enter valid task details.");
    return;
  }

  const elapsedTime = Math.floor((endTime - startTime) / 1000);
  const manualData = { task: taskName, startTime, elapsedTime };
  trackingData.push(manualData);
  addPastTracking(manualData);
  updateChart();

  manualForm.style.display = "none";
  saveToLocalStorage();
});

cancelManualButton.addEventListener("click", () => {
  manualForm.style.display = "none";
});

// Display past trackings
function addPastTracking(data) {
  const div = document.createElement("div");
  div.className = "pastDivs";
  div.innerHTML = `
    <h1>${data.task}</h1>
    <p>Start: ${new Date(data.startTime).toLocaleString()}</p>
    <p>Time spent: ${formatTime(data.elapsedTime)}</p>
    <button class="remove">Remove</button>
  `;
  div.querySelector(".remove").addEventListener("click", () => {
    div.remove();
    trackingData = trackingData.filter((d) => d !== data);
    saveToLocalStorage(); // Ensure the local storage is updated
  });
  pastTrackings.appendChild(div);
}

// Go to Analytics button
goToAnalytics.addEventListener("click", () => {
  analyticsSection.style.display = "block";
  window.scrollTo({
    top: analyticsSection.offsetTop,
    behavior: "smooth",
  });
  updateChart();
});

// Update chart based on view selection
viewSelector.addEventListener("change", () => {
  updateChart();
});

// Aggregate data for chart
function aggregateData(data) {
  const aggregated = {};
  data.forEach((d) => {
    if (!aggregated[d.task]) {
      aggregated[d.task] = 0;
    }
    aggregated[d.task] += d.elapsedTime;
  });
  return Object.entries(aggregated).map(([task, time]) => ({ task, time }));
}

// Update chart
function updateChart() {
  const aggregatedData = aggregateData(trackingData);

  const labels = aggregatedData.map((d) => d.task);
  const data = aggregatedData.map((d) => d.time);

  if (trackingChart) {
    trackingChart.destroy();
  }

  trackingChart = new Chart(trackingChartElement, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Time Spent",
          data,
          backgroundColor: "#4a90e2",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              const hours = Math.floor(value / 3600);
              const minutes = Math.floor((value % 3600) / 60);
              const seconds = value % 60;
              const formattedHours = String(hours).padStart(2, "0");
              const formattedMinutes = String(minutes).padStart(2, "0");
              const formattedSeconds = String(seconds).padStart(2, "0");
              return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const hours = Math.floor(value / 3600);
              const minutes = Math.floor((value % 3600) / 60);
              const seconds = value % 60;
              const formattedHours = String(hours).padStart(2, "0");
              const formattedMinutes = String(minutes).padStart(2, "0");
              const formattedSeconds = String(seconds).padStart(2, "0");
              return `${context.label}: ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
            },
          },
        },
      },
    },
  });
}

// Save data to local storage
function saveToLocalStorage() {
  const dataToSave = trackingData.map((item) => ({
    ...item,
    startTime: item.startTime.toISOString(),
  }));
  localStorage.setItem("trackingData", JSON.stringify(dataToSave));
}

// Load data from local storage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem("trackingData");
  if (savedData) {
    try {
      trackingData = JSON.parse(savedData).map((item) => ({
        ...item,
        startTime: new Date(item.startTime),
      }));
      trackingData.forEach((data) => {
        addPastTracking(data);
      });
      updateChart();
    } catch (error) {
      console.error("Failed to parse tracking data from local storage:", error);
    }
  }
}

// Load data when the page loads
window.addEventListener("load", loadFromLocalStorage);
