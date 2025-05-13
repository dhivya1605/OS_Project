let processes = [];

function addProcess() {
  const pid = document.getElementById("pid").value;
  const arrival = parseInt(document.getElementById("arrival").value);
  const burst = parseInt(document.getElementById("burst").value);

  if (!pid || isNaN(arrival) || isNaN(burst)) {
    alert("Please fill all fields!");
    return;
  }

  processes.push({ pid, arrival, burst });

  const table = document.getElementById("processTable");
  const row = table.insertRow();
  row.insertCell(0).innerText = pid;
  row.insertCell(1).innerText = arrival;
  row.insertCell(2).innerText = burst;

  document.getElementById("pid").value = "";
  document.getElementById("arrival").value = "";
  document.getElementById("burst").value = "";
}

function calculateAverages(procs) {
  const totalTAT = procs.reduce((acc, p) => acc + p.tat, 0);
  const totalWT = procs.reduce((acc, p) => acc + p.wt, 0);
  const avgTAT = totalTAT / procs.length;
  const avgWT = totalWT / procs.length;
  return { avgTAT, avgWT };
}

function updateAveragesTable(avgTAT, avgWT) {
  document.getElementById("avgTAT").textContent = avgTAT.toFixed(2);
  document.getElementById("avgWT").textContent = avgWT.toFixed(2);
}

function displayResults(results, gantt) {
  let resultTable = document.getElementById("resultTable");
  resultTable.innerHTML = `
    <tr>
      <th>Process ID</th>
      <th>Arrival Time</th>
      <th>Burst Time</th>
      <th>Turnaround Time</th>
      <th>Waiting Time</th>
    </tr>
  `;
  results.forEach(p => {
    let row = resultTable.insertRow();
    row.insertCell(0).innerText = p.pid;
    row.insertCell(1).innerText = p.arrival;
    row.insertCell(2).innerText = p.burst;
    row.insertCell(3).innerText = p.tat;
    row.insertCell(4).innerText = p.wt;
  });

  let ganttChart = document.getElementById("ganttChart");
  ganttChart.innerHTML = "";
  gantt.forEach(g => {
    let bar = document.createElement("div");
    bar.className = "gantt-bar";
    bar.innerText = `${g.pid} (${g.start}-${g.end})`;
    ganttChart.appendChild(bar);
  });

  // Calculate averages and update the averages table
  const { avgTAT, avgWT } = calculateAverages(results);
  updateAveragesTable(avgTAT, avgWT);
}

function fcfs() {
  let procs = JSON.parse(JSON.stringify(processes));
  procs.sort((a, b) => a.arrival - b.arrival);
  let currentTime = 0, gantt = [];

  procs.forEach(p => {
    if (currentTime < p.arrival) currentTime = p.arrival;
    let start = currentTime;
    currentTime += p.burst;
    p.tat = currentTime - p.arrival;
    p.wt = p.tat - p.burst;
    gantt.push({ pid: p.pid, start, end: currentTime });
  });

  displayResults(procs, gantt);
}

function sjf() {
  let procs = JSON.parse(JSON.stringify(processes));
  let completed = [], currentTime = 0, gantt = [];

  while (completed.length < procs.length) {
    let available = procs.filter(p => !p.done && p.arrival <= currentTime);
    if (available.length === 0) { currentTime++; continue; }
    available.sort((a, b) => a.burst - b.burst);
    let p = available[0];
    let start = currentTime;
    currentTime += p.burst;
    p.tat = currentTime - p.arrival;
    p.wt = p.tat - p.burst;
    p.done = true;
    gantt.push({ pid: p.pid, start, end: currentTime });
    completed.push(p);
  }

  displayResults(completed, gantt);
}

function srtf() {
  let procs = JSON.parse(JSON.stringify(processes));
  procs.forEach(p => p.remaining = p.burst);
  let completed = [], currentTime = 0, gantt = [], lastProcess = null;

  while (completed.length < processes.length) {
    let available = procs.filter(p => p.remaining > 0 && p.arrival <= currentTime);
    if (available.length === 0) { currentTime++; continue; }
    available.sort((a, b) => a.remaining - b.remaining);
    let p = available[0];

    if (lastProcess !== p.pid) gantt.push({ pid: p.pid, start: currentTime });
    currentTime++;
    p.remaining--;
    if (lastProcess !== p.pid) {
      if (gantt[gantt.length - 2]) gantt[gantt.length - 2].end = currentTime - 1;
    }
    lastProcess = p.pid;

    if (p.remaining === 0) {
      p.tat = currentTime - p.arrival;
      p.wt = p.tat - p.burst;
      completed.push(p);
      gantt[gantt.length - 1].end = currentTime;
    }
  }

  displayResults(procs, gantt);
}

function priorityScheduling() {
  let procs = JSON.parse(JSON.stringify(processes));
  procs.forEach(p => p.priority = parseInt(prompt(`Enter priority for ${p.pid}`)));
  let completed = [], currentTime = 0, gantt = [];

  while (completed.length < procs.length) {
    let available = procs.filter(p => !p.done && p.arrival <= currentTime);
    if (available.length === 0) { currentTime++; continue; }
    available.sort((a, b) => a.priority - b.priority);
    let p = available[0];
    let start = currentTime;
    currentTime += p.burst;
    p.tat = currentTime - p.arrival;
    p.wt = p.tat - p.burst;
    p.done = true;
    gantt.push({ pid: p.pid, start, end: currentTime });
    completed.push(p);
  }

  displayResults(completed, gantt);
}

function roundRobin() {
  let tq = parseInt(prompt("Enter Time Quantum:"));
  let procs = JSON.parse(JSON.stringify(processes));
  procs.forEach(p => p.remaining = p.burst);
  let completed = [], currentTime = 0, gantt = [];

  while (completed.length < processes.length) {
    let executed = false;
    procs.forEach(p => {
      if (p.remaining > 0 && p.arrival <= currentTime) {
        let start = currentTime;
        let execTime = Math.min(tq, p.remaining);
        currentTime += execTime;
        p.remaining -= execTime;
        gantt.push({ pid: p.pid, start, end: currentTime });
        if (p.remaining === 0) {
          p.tat = currentTime - p.arrival;
          p.wt = p.tat - p.burst;
          completed.push(p);
        }
        executed = true;
      }
    });
    if (!executed) currentTime++;
  }

  displayResults(procs, gantt);
}
