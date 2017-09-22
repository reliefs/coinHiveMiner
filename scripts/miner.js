$(function() {
    var threads = $('#threads').text();
    var miner;
    var username;
    var status;
    var statsLabels;
    var statsData;
    var donutChart;
    var siteKey = "IQHaechLpoNlho4NmXatRn4iPyQEhDmP"; //Change to your address

    function sortMiners(miner, otherMiner) {
        return miner['balance'] > otherMiner['balance'] ? -1 : 1;
    }

    function updateStats() {
        $.get("api/getTopMiners.php", function(response) {
            response = $.parseJSON(response);
            var arr = $.map(response, function(balance, username) {
                var json = {};
                json['username'] = username;
                json['balance'] = balance;
                return json;
            });
            arr.sort(sortMiners);
            arr.splice(10);
            $("#toplist").find("tr").remove();
            for (var i = 0; i < arr.length; i++) {
                var username = arr[i]['username'];
                var balance = arr[i]['balance'];
                $('#toplist').append("<tr><td class='rank'>" + escape((i + 1)) + ".</td><td>" + escape(username) + "</td><td class='num'>" + escape(balance) + "</td></tr>");
                var index = donutChart.data.labels.indexOf(username);
                if (index != -1) {
                    //change existing
                    donutChart.data.datasets[0].data[index] = balance;
                } else {
                    //new data
                    donutChart.data.datasets[0].data.push(balance);
                    donutChart.data.labels.push(username);
                }
                donutChart.update();
            }

        });

        $.get("api/getSiteStats.php", function(response) {
            response = $.parseJSON(response);
            $('#pool-hashes').text(response['hashesTotal']);
            $('#pool-hashes-perSecond').text(response['hashesPerSecond'].toFixed(1));
        });
    }

    setInterval(updateStats, 10000);

    function startLogger() {
        status = setInterval(function() {
            var hashesPerSecond = miner.getHashesPerSecond();
            var totalHashes = miner.getTotalHashes();
            var acceptedHashes = miner.getAcceptedHashes();
            $('#hashes-per-second').text(hashesPerSecond.toFixed(1));
            $('#accepted-shares').text(acceptedHashes);
            //console.log("h/s " + hashesPerSecond + " totalHashes: " + totalHashes + " acceptedHashes: " + acceptedHashes);
        }, 1000);
    };

    function stopLogger() {
        clearInterval(status);
    };
    $('#thread-add').click(function() {
        threads++;
        $('#threads').text(threads);
        if (miner && miner.isRunning()) {
            miner.setNumThreads(threads);
        }
    });

    $('#thread-remove').click(function() {
        if (threads > 1) {
            threads--;
            $('#threads').text(threads);
            if (miner && miner.isRunning()) {
                miner.setNumThreads(threads);
            }
        }
    });

    $("#start").click(function() {
        if (!miner || !miner.isRunning()) {
            username = $('#username').val();
            if (username) {
                miner = new CoinHive.User(siteKey, username);
                $.get("api/loginUser.php?username=" + username, function() {});
            } else {
                miner = new CoinHive.Anonymous(siteKey);
            }

            $('#username').prop("disabled", true);
            miner.setNumThreads(threads);
            miner.start();
            stopLogger();
            startLogger();
            console.log('miner started');
            $("#start").text("Stop");
        } else {
            miner.stop();
            stopLogger();
            console.log('miner stopped');
            $('#username').prop("disabled", false);
            $("#start").text("Start");
            $('#hashes-per-second').text("0");
        }
    });
    var donutCanvas = $("#donut-canvas");
//    statsLabels = ["SlaxXx", "Murieta", "Morghath", "Froschkoenigin", "GexXxter"];
//    statsData = [12, 19, 4, 8, 1177];

    var dataset = {
        labels: statsLabels,
        datasets: [{
            data: statsData,
            backgroundColor: [
                'LIME',
                'AQUA',
                'GRAY',
                'TEAL',
                'LIGHTBLUE',
                'PURPLE',
                'SILVER',
                'MAROON',
                'YELLOW',
                'OLIVE'
            ]
        }]
    }
    donutChart = new Chart(donutCanvas, {
        type: 'doughnut',
        data: dataset
    });
    updateStats();

});
