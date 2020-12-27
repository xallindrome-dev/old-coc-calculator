(function () {
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.substring(1);
    }

    const capitalizeFirstLetters = (phrase) => {
        return phrase.split(" ")
            .map(b => {
                return capitalize(b);
            })
            .join(' ');
    }

    const toThousands = (number) => {
        return number.toLocaleString();
    }

    const toAbbreviated = (num, fixed) => {
        if (num === null) { return null; } // terminate early
        if (num === 0) { return '0'; } // terminate early
        if (num < 1000) { return num; }
        fixed = (!fixed || fixed < 0) ? 0 : fixed; // number of decimal places to show
        var b = (num).toPrecision(2).split("e"), // get power
            k = b.length === 1 ? 0 : Math.floor(Math.min(b[1].slice(1), 14) / 3), // floor at decimals, ceiling at trillions
            c = k < 1 ? num.toFixed(0 + fixed) : (num / Math.pow(10, k * 3)).toFixed(1 + fixed), // divide by power
            d = c < 0 ? c : Math.abs(c), // enforce -0 is 0
            e = d + ['', 'K', 'M', 'B', 'T'][k]; // append power
        return e;
    }

    const generateListItem = (item) => {
        let outcome = '';
        if (item.outcome) {
            outcome = `${item.outcome.displayName} increased by ${toAbbreviated(item.outcome.amount)}`;
        }

        const listItem = `<li class="list-group-item">						
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">${capitalizeFirstLetters(item.name)}</h5>
                                <small class="text-muted">${item.time} hours</small>
                            </div>
                            <p class="mb-1">
                                ${outcome}
                            </p>
                            <small class="text-muted">Cost: ${toThousands(item.cost)} ${item.resource}</small>
                    </li>`;

        return listItem;
    }

    const generateListItems = (items) => {
        let listItems = $(`<ul class="list-group list-group-flush"></ul>`);

        for (var i = 0; i < items.length; i++) {
            const item = items[i];
            const listItem = $(generateListItem(item));
            listItems.append(listItem);
        }

        return listItems.html();
    }

    const generateCardChart = (id, totals) => {
        let ctx = document.getElementById(id);

        var myBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Starting Gold", "Ending Gold", "Starting Elixer", "Ending Elixer"],
                datasets: [
                    {
                        label: 'Resources',
                        data: [totals.startingGold, totals.totalGold, totals.startingElixer, totals.totalElixer],
                        backgroundColor: ['#ffd23d', '#dbac0f', '#a103fc', '#5f0494'],
                        borderColor: ['#ffd23d', '#dbac0f', '#a103fc', '#5f0494'],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                "scales": { "xAxes": [{ "ticks": { "beginAtZero": true } }] },

                legend: { display: false }
            }
        });
    }

    const generateCard = (data) => {
        this.index = this.index || 0;
        const listItems = generateListItems(data.items);
        const builds = data.items
            .map(item => {
                return capitalizeFirstLetters(item.name);
            })
            .join(', ');

        let goldWarning = data.atMaxGold ? '<i class="fas fa-2x fa-exclamation-circle text-warning"></i>' : '';
        let elixerWarning = data.atMaxElixer ? '<i class="fas fa-exclamation-circle text-elixer ml-2"></i>' : '';

        let costs = [];

        if (data.goldCost) {
            costs.push(`Gold: ${toAbbreviated(data.goldCost)}`);
        }

        if (data.elixerCost) {
            costs.push(`Elixer: ${toAbbreviated(data.elixerCost)}`);
        }

        const card = $(`<div class="card">
                          <div class="card-header">
                            ${moment(data.startDate).format("dddd MM, YYYY [at] hh:mm a")}
                          </div>
                          <div class="card-body">
                            <h5 class="card-title">Builds: ${builds}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">Total Build Time: ${data.totalBuildTime} hours</h6>	
                            ${costs.length > 0 ? '<p class="card-text">Total Cost: ' + costs.join(', ') + '</p>' : ''}	       	
                          </div>
                          <div class="card-body">
                            <canvas id="${moment(data.startDate).format("ddddMMYYYYhhmma") + this.index}"></canvas>
                          </div>
                          ${listItems}
                          <div class="card-footer text-right text-muted">
                            &nbsp;	
                            ${goldWarning}
                            ${elixerWarning}
                          </div>
                        </div>`);

        const cards = $(".cards");
        let lastCardDeck = cards.children().last();

        if (lastCardDeck.children().length < 3) {
            lastCardDeck.append(card);
        } else {
            let cardDeck = $("<div class='card-deck mt-3 mb-1'></div>");
            cardDeck.append(card);
            cards.append(cardDeck);
        }

        generateCardChart(moment(data.startDate).format("ddddMMYYYYhhmma") + this.index, {
            totalGold: data.totalGold,
            totalElixer: data.totalElixer,
            startingElixer: data.startingElixer,
            startingGold: data.startingGold
        })

        this.index++;
    }

    const calculateBoostHours = (hours) => {
        //let numOfBoosts = Math.floor(v.hoursElapsed / boostWaitHours);
        let numOfBoosts = Math.floor(hours / boostWaitHours);
        //console.log('numOfBoosts', numOfBoosts);

        let totalBoostHours = ((boostTime / 60) * numOfBoosts) / 60;
        //console.log('totalBoostHours', totalBoostHours);

        return totalBoostHours;
    }

    let variables = {
        gold: 2140000,
        elixer: 673000,

        mines: 3,
        gRate: 4000,
        eRate: 3500,
        gemRate: 3.1,

        dailyBonus: 370000,

        maxGem: 14,
        maxGold: 4200000,
        maxElixer: 3400000,

        resourceThreshold: 200000,

        hoursElapsed: 0,
        totalGoldSpent: 0,
        totalElixerSpent: 0
    }

    let boostMultiplier = 8;
    let boostTime = 9;
    let boostWaitHours = 7;

    let boostShavedMinutes = (boostTime * boostMultiplier) - boostTime;

    let buildEvents = [];

    let v = variables;

    let day = {
        startDate: new Date(2019, 8, 15, 8),
        items: [],
        totalGold: 0,
        totalElixer: 0,
        startingGold: 0,
        startingElixer: 0,
        goldCost: 0,
        elixerCost: 0,
        totalBuildTime: 0,
        endDate: new Date(),
        atMaxGold: false,
        atMaxElixer: false
    };
    let days = [];

    const calculateCost = (build) => {
        const buildEstimate = v[build.resource] - build.cost;

        if (buildEstimate < 0) {
            console.log('buildEstimate', buildEstimate);
            console.log('Used ' + build.resource + ' Generator');
            console.log(build.resource + ' Current Amount', v[build.resource]);
            v[build.resource] = v['max' + build.resource.charAt(0).toUpperCase() + build.resource.substring(1)];
        }

        v[build.resource] -= build.cost;
    }

    const calculateResourcesEarned = (hours, bonus) => {
        const boostHours = calculateBoostHours(hours);

        const boostRate = v.mines * boostHours * boostMultiplier;
        const boostedGold = v.gRate * boostRate;
        const boostedElixer = v.eRate * boostRate;

        const goldGenerated = v.gRate * v.mines * (hours - boostHours);
        const elixerGenerated = v.eRate * v.mines * (hours - boostHours);

        const goldEarned = goldGenerated + boostedGold + bonus;
        const elixerEarned = elixerGenerated + boostedElixer + bonus;

        v.gold = parseInt(v.gold.toString(), 10) + goldEarned;
        v.elixer = parseInt(v.elixer.toString(), 10) + elixerEarned;

        return {
            goldEarned,
            elixerEarned
        }
    }

    const calculateDailyBonus = (days) => {
        let bonus = 0;
        for (let j = 0; j < days; j++) {
            bonus += parseInt(v.dailyBonus.toString(), 10);
        }

        return bonus;
    }

    const checkMaxes = (day) => {
        if (v.gold >= v.maxGold) {
            v.gold = v.maxGold;
            day.atMaxGold = true;
        }

        if (v.elixer >= v.maxElixer) {
            v.elixer = v.maxElixer;
            day.atMaxElixer = true;
        }
    }

    const resetDay = (startDate, totalGold, totalElixer) => {
        return {
            startDate: startDate,
            items: [],
            startingGold: totalGold,
            startingElixer: totalElixer,
            totalGold: 0,
            totalElixer: 0,
            goldCost: 0,
            elixerCost: 0,
            totalBuildTime: 0,
            endDate: new Date(startDate),
            atMaxGold: false,
            atMaxElixer: false
        }
    }

    const calculate = () => {
        let preGold = parseInt(v.gold.toString(), 10);
        let preElixer = parseInt(v.elixer.toString(), 10);

        for (let buildIndex = 0; buildIndex < buildEvents.length; buildIndex++) {
            const build = buildEvents[buildIndex];

            if (buildIndex > 0) {
                preGold = parseInt(v.gold.toString(), 10);
                preElixer = parseInt(v.elixer.toString(), 10);
            }

            v.hoursElapsed += build.time;
            day.totalBuildTime += build.time;

            const totalAddedHours = day.endDate.getHours() + build.time;
            const daysElapsed = Math.floor(totalAddedHours / 24);
            const bonus = calculateDailyBonus(daysElapsed);

            calculateResourcesEarned(build.time, bonus);

            day.endDate.setHours(totalAddedHours);

            calculateCost(build);

            if (build.outcome) v[build.outcome.variable] += build.outcome.amount;

            checkMaxes(day);

            day.goldCost += build.resource === 'gold' ? build.cost : 0;
            day.elixerCost += build.resource === 'elixer' ? build.cost : 0;

            if (daysElapsed == 0) {
                day.items.push(build);
            } else {
                day.totalGold = parseInt(v.gold.toString(), 10);
                day.totalElixer = parseInt(v.elixer.toString(), 10);
                day.startingGold = preGold;
                day.startingElixer = preElixer;
                day.endDate = new Date(day.endDate);
                day.items.push(build);
                generateCard(day);
                days.push(day);
                day = resetDay(day.endDate, day.totalGold, day.totalElixer);
            }

            v.totalGoldSpent += build.resource === 'gold' ? build.cost : 0;
            v.totalElixerSpent += build.resource === 'elixer' ? build.cost : 0;
        }

        $(".gold-spent").text(toAbbreviated(v.totalGoldSpent));
        $(".elixer-spent").text(toAbbreviated(v.totalElixerSpent));
        $(".days-elapsed").text(Math.floor(v.hoursElapsed / 24));
    }

    const emptyCardDecks = () => {
        $(".cards").empty();
        $(".cards").append($("<div class='card-deck'></div>"));
    }

    const setVariables = () => {
        let values = {};
        let $inputs = $("form :input");
        $inputs.each(function () {
            if (this.id === 'startDate') {
                values[this.id] = $('#' + this.id).val();
                day.startDate = new Date(values[this.id]);
                day.endDate = new Date(day.startDate);
            } else {
                values[this.id] = parseInt($('#' + this.id).val().toString(), 10);
            }
        });

        v = {
            ...values,
            resourceThreshold: 200000,
            hoursElapsed: 0,
            totalGoldSpent: 0,
            totalElixerSpent: 0
        }
    }

    const createSortableItems = () => {
        for (let i = 0; i < buildEvents.length; i++) {
            const build = buildEvents[i];
            let listItem = $(`<li class='list-group-item' id="${build.id}">${capitalizeFirstLetters(build.name)}</li>`);
            $(".sortable").append(listItem);
        }

        $(".sortable")
            .sortable({
                start: function (event, ui) {
                    const startPos = ui.item.index();
                    ui.item.data('startPos', startPos);
                },
                placeholder: "bg-info",
                update: function (event, ui) {
                    const startPos = ui.item.data('startPos');
                    const endPos = ui.item.index();

                    let temp = buildEvents[startPos];
                    buildEvents[startPos] = buildEvents[endPos];
                    buildEvents[endPos] = temp;

                    emptyCardDecks();
                    setVariables();
                    days = [];

                    calculate();
                    generateChart();
                }
            })
            .disableSelection();
    }

    const generateChart = () => {
        let ctx = document.getElementById("buildPlanChart");
        let momentStartDate = moment(days[0].startDate);
        let momentEndDate = moment(day.endDate);

        let beginningDay = momentStartDate.day();

        let numDaysBetween = momentEndDate.diff(momentStartDate, 'days');

        const daysOfWeekFromStart = Array.apply(null, Array(numDaysBetween)).map(function (_, i) {
            let start = i + beginningDay;

            if (start > 7) start -= 7;

            return moment().day(start).format("dddd");
        });

        let startingGoldData = [];
        let startingElixerData = [];

        let usedBuildDays = {};
        let dayIds = days.map((v, index) => {
            return { ...v, id: index };
        });
        for (var i = 0; i < daysOfWeekFromStart.length; i++) {
            let dayOfWeek = daysOfWeekFromStart[i];

            let buildDay = dayIds.filter((value, index) => {
                return moment(value.startDate).format("dddd") === dayOfWeek;
            });

            const expireBuildDay = (buildDay, index = 0) => {
                let build = buildDay[index];
                if (build) {
                    if (usedBuildDays[build.id]) {
                        index++;
                        return expireBuildDay(buildDay, index);
                    } else {
                        usedBuildDays[build.id] = true;
                    }
                }

                return build;
            }

            if (buildDay.length > 0) {
                let build = expireBuildDay(buildDay);

                if (build) {
                    startingGoldData.push(build.startingGold);
                    startingElixerData.push(build.startingElixer);
                } else {
                    startingGoldData.push(null);
                    startingElixerData.push(null);
                }
            } else {
                startingGoldData.push(null);
                startingElixerData.push(null);
            }
        }

        console.log(startingGoldData);
        console.log(daysOfWeekFromStart);
        console.log(numDaysBetween);

        let buildPlanChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: daysOfWeekFromStart,
                datasets: [
                    {
                        label: 'Starting Gold',
                        data: startingGoldData,
                        lineTension: 0,
                        backgroundColor: 'transparent',
                        borderColor: '#ffd23d',
                        borderWidth: 4,
                        pointBackgroundColor: '#ffd23d'
                    },
                    {
                        label: 'Starting Elixer',
                        data: startingElixerData,
                        lineTension: 0,
                        backgroundColor: 'transparent',
                        borderColor: '#a103fc',
                        borderWidth: 4,
                        pointBackgroundColor: '#a103fc'
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                },
                legend: {
                    display: true
                },
                spanGaps: true
            }
        });
    }

    const init = () => {
        let $inputs = $("form :input");

        $inputs.each(function () {
            const id = '#' + this.id;
            $(id).val(v[this.id]);
        });

        $("#startDate").val(day.startDate.toJSON().slice(0, 19));

        $.get("../buildings.json", (response) => {
            buildEvents = response;

            createSortableItems();

            calculate();
            generateChart();
        });

        $("form").on("submit", () => {
            setVariables();
            emptyCardDecks();
            days = [];

            calculate();
            generateChart();
        });

        $inputs.on("change", () => {
            $("form").submit();
            console.log(v);
        });
    }

    init();
})();