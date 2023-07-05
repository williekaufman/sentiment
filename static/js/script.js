// URL = 'http://ec2-34-192-101-140.compute-1.amazonaws.com:5003'

URL = 'http://localhost:5001'

wordTextInput = document.getElementById('word-text-field');
wordTwoTextInput = document.getElementById('word-two-text-field');
passwordTextInput = document.getElementById('password-text-field');

chartContainer = document.getElementById('chart-container');

chart = null;

averageLines = []

currentChart = null;

newGameButton = document.getElementById('new-game-btn');

previousToast = null;

gameData = null;

currentChart = null;

randomizeLabelHeights = false;

darkColors = [
    'darkblue',
    'darkorange',
    'black',
    'darkgreen',
    'darkred',
    'darkpurple',
    'darkcyan',
].reverse();

lightColors = [
    'red',
    'green',
    'cyan',
    'purple',
    'darkyellow',
    'orange',
].reverse();


function shuffle(array) {
    array = [...array];

    var currentIndex = array.length, randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

function intersperseLists(list1, list2) {
  var result = [];
  var maxLength = Math.max(list1.length, list2.length);

  for (var i = 0; i < maxLength; i++) {
    if (i < list1.length) {
      result.push(list1[i]);
    }
    if (i < list2.length) {
      result.push(list2[i]);
    }
  }

  return result;
}

colors = intersperseLists(darkColors, lightColors);

function showToast(message, seconds = 3) {
    const toast = document.createElement('div');

    toast.classList.add('toast');
    toast.textContent = message;

    previousToast?.remove();

    previousToast = toast;

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.remove();
    }, seconds * 1000);
}

function fetchWrapper(url, body, method = 'POST') {
    if (method == 'GET') {
        if (body) {
            url = `${url}?`;
        }
        for (var key in body) {
            url = `${url}${key}=${body[key]}&`;
        }
    }
    return fetch(url, makeRequestOptions(body, method));
}

function makeRequestOptions(body, method = 'POST') {
    if (method == 'GET') {
        return {
            method,
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
        };
    }

    return {
        method,
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

function newGame() {
    currentChart && currentChart.destroy();
    currentChart = null;
    averageLines = [];
    colors = intersperseLists(darkColors, lightColors);
}

function getData() {
    const body = {
        'word': wordTextInput.value,
        'password': passwordTextInput.value,
    }

    fetchWrapper(`${URL}/query`, body, 'GET')
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                plot(data)
            } else {
                showToast(data.message);
            }
        })
}

async function handleKeyDown(e) {
    if (!e.ctrlKey || !e.altKey) {
        return;
    } if (e.key === 'n') {
        e.preventDefault();
        await newGame();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        getData();
    } else if (e.key === 'l') {
        e.preventDefault();
        toggleLine(currentChart);
    } else if (e.key === 'r') {
        randomizeLabelHeights = !randomizeLabelHeights;
        refreshVerticalLines(currentChart);
    }
}

document.addEventListener('keydown', handleKeyDown);

newGameButton.addEventListener('click', newGame);

passwordTextInput.value = localStorage.getItem('familyFeudPassword');

passwordTextInput.addEventListener('keydown', function (e) {
    if (e.key == 'Enter') {
        localStorage.setItem('familyFeudPassword', passwordTextInput.value);
    } if (e.key == 'Escape') {
        passwordTextInput.blur();
    }
})

passwordTextInput.addEventListener('blur', function () {
    localStorage.setItem('familyFeudPassword', passwordTextInput.value);
})

wordTextInput.addEventListener('keydown', function (e) {
    if (e.key == 'Escape') {
        wordTextInput.blur();
    } if (e.key == 'Enter') {
        e.preventDefault();
        getData();
        wordTextInput.value = '';
    }
})

function toggleLine(chart) {
    chart.config.type = chart.config.type === 'line' ? 'scatter' : 'line';
    chart.update();
}

function randomPercentage() {
    return (Math.random() * 100).toString() + '%';
}

function makeLine(line) {
    return {
        type: 'line',
        mode: 'vertical',
        scaleID: 'x',
        value: line['value'],
        borderColor: line['color'],
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
            position: randomizeLabelHeights ? randomPercentage() : line['position'],
            backgroundColor: line['color'],
            content: line['label'],
            display: true,
            color: 'white',
        }
    }
}

function drawVerticalLine(chart, x_value, y_value, color, label) {
    averageLines.push({ 'value': x_value, 'color': color , 'label': label, 'position': ((1 - y_value) * 100).toString() + '%'})

    refreshVerticalLines(chart);
}

function refreshVerticalLines(chart) {
    chart.options.plugins = {
        annotation: {
            annotations: averageLines.map(makeLine)
        }
    }

    chart.update();
}

function plot(data) {
    if (!chart) {
        chart = document.createElement('canvas');
        chartContainer.appendChild(chart);
    }
    let ctx = chart.getContext('2d');

    const labels = Object.keys(data['answer']).map((label) => Number(label));
    const values = Object.values(data['answer']);

    let v = []

    for (let i = 0; i < 11; i++) {
        if (!labels.includes(i)) {
            labels.push(i);
            values.push(0);
        }
    }

    for (let i = 0; i < labels.length; i++) {
        v.push({
            x: labels[i],
            y: values[i]
        })
    }

    v = v.sort((a, b) => a.x - b.x);

    let cumulative = 0;

    for (let i = 0 ; i < v.length; i++) {
        cumulative += v[i]['y'];
        v[i]['y'] = 1 - cumulative;
    }

    const options = {
        scales: {
            y: {
                beginAtZero: true
            },
            x: {
                beginAtZero: true
            }
        },
        annotation: {
            annotations: []
        },
    };

    let c = colors.pop();

    let dataset = {
        label: data.word,
        data: v,
        backgroundColor: c,
        borderColor: c,
        borderWidth: 1,
        pointRadius: 10,
    }

    if (currentChart) {
        currentChart.data.datasets.push(dataset);
        currentChart.update();
    } else {
        currentChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [dataset],
            },
            options: options,
        });
    };


    mean = data['mean'];

    weight_on_floor = Math.ceil(mean) - mean;
    
    function lookup(x) {
        for (let i = 0; i < v.length; i++) {
            if (v[i]['x'] == x) {
                return v[i]['y'];
            }
        }
    }
    
    y_value_at_mean = weight_on_floor * lookup(Math.floor(mean)) + (1 - weight_on_floor) * lookup(Math.ceil(mean));
    
    drawVerticalLine(currentChart, data['mean'], y_value_at_mean, c, data['word']);
}
