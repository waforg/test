Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

$(function () {
    //scatter对象，用来判断
    var scatter = null,
        //选择的队伍
        seletedTeam = null,
        //
        money = null,
        eos = null,
        eosPrice = null,
        endTime = null,
        roundMask = null,
        roundRedMask = null,
        roundKey = null,
        isEnded = false,
        roundBlueMask = null,
        base = 1000000,
        protocol = 'http',
        host = 'dev.cryptolions.io',
        port = 38888,
        chainId = "038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca",
        network = {
            protocol: protocol,
            host: host,
            port: port,
            blockchain: 'eos',
            chainId: chainId
        },
        api = Eos({
            httpEndpoint: protocol + "://" + host + ":" + port,
            chainId: chainId
        }),
        //接收方账号
        teamAccount = "sjcviptesta2",
        //生效范围
        scope = "sjcviptesta2",
        //合约
        code = "sjcviptesta2";

    var app = {
        init: function () {

            //初始化相关事件
            app._initEvent();

            //获取当前eos价格
            app._fetchEosPrice();

            //判断右上角展示的按钮字
            if (localStorage.getItem('account')) {
                $("#log-btn").html("退出");
            } else {
                $("#log-btn").html("登录Scatter");
                $(".scatter").show();
            }

            //获取round信息
            setTimeout(app._fetchRound, 3000)

            //获取用户信息
            setTimeout(app._fetchUser, 3000)
        },
        //获取游戏信息
        _fetchRound: function () {
            api.getTableRows(true, code, scope, "round").then(function (data) {
                if (data.rows.length == 0) {
                    money = app._calMoney($("#keysToBuy").val(), 0);
                    $("#current-money").html("@ " + money + " EOS");
                    Dialog.init("游戏尚未开始")
                    return
                }

                var row = data.rows[0];

                //游戏已结束
                if (row.ended > 0) {
                    isEnded = true;
                    endTime = convertToLocalTime(row.ended);
                }else{
                    endTime=row.end;
                }

                //key总量
                roundKey = row.key;
                money = app._calMoney($("#keysToBuy").val(), roundKey)
                //总利润计算的变量
                roundMask = row.mask;
                //红队利润计算的变量
                roundRedMask = row.redmask;
                //蓝队利润计算变量
                roundBlueMask = row.bluemask;
                //奖池EOS数量
                $(".pot").html(row.pot + " EOS");
                if (eosPrice) {
                    $("#pot-usdt").html("≙ " + Math.floor(row.pot * eosPrice) / 100 + " USDT");
                }

                $("#total-keys").html("Total " + roundKey + " Keys");

                $("#current-money").html("@ " + money + " EOS");

                //最新玩家
                $("#current-user").html("最新玩家:"+row.player );
                $("#red-eos").html(row.red/100+" KEY");
                $("#blue-eos").html(row.blue/100+" KEY");

                //已买入EOS数量
                $("#invested-eos").html(row.eos / 10000 + " EOS");
                if (eosPrice) {
                    var usdt = eosPrice * row.eos / 10000;
                    usdt = Math.floor(usdt * 100) / 100;
                    $("#invested-usdt").html("≙ " + usdt + " USDT");
                }

                //已分配奖金
                var rewards = (row.eos - row.pot) / 10000;
                $("#rewards").html(rewards + " EOS");
                if (eosPrice) {
                    $("#rewards-usdt").html("≙ " + Math.floor(rewards * eosPrice * 100) / 100 + " USDT");
                }
                setTimeout(app._fetchRound(), 10000);
            });
        },
        //获取用户信息
        _fetchUser:function () {
            var account = localStorage.getItem('account');
            var accountName = null;

            if (account) {
                accountName = JSON.parse(localStorage.getItem('account')).name;
            }

            //TODO 测试
            //accountName="sjcjteost1";

            if (accountName) {


                api.getTableRows(true, code, accountName, "player").then(function (data) {

                    if (data.rows.length >= 1) {
                        var row = data.rows[0];
                        $("#your-keys").html(row.key / 100);
                        if (roundMask) {
                            var scammed = Math.floor(row.key * roundMask / base - row.mask + row.pot_vault) / 10000;
                            if (roundRedMask !== null) {
                                scammed += Math.floor((row.red * roundRedMask + row.blue * roundBlueMask) / base) / 10000;
                            }
                            $("#scammed").html(scammed + " EOS");
                            var advice = row.aff_vault / 10000;
                            $("#advice").html(advice + " EOS");
                            var gains = advice + scammed;
                            gains = Math.floor(gains * 10000) / 10000;
                            $(".gains").html(gains + " EOS");
                            $("#cost").html(row.eos / 10000 + " EOS")
                            if (eosPrice) {
                                var usdt = Math.floor(eosPrice * gains * 100) / 100;
                                $(".gains-usdt").html("≙ " + usdt + " USDT");
                            }
                        }
                    } else {
                        $("#your-keys").html("0.00");
                        $("#scammed").html("0.0000 EOS");
                        $("#advice").html("0.0000 EOS");
                        $(".gains").html("0.0000 EOS");
                        $(".gains-usdt").html("≙ 0.00 USDT");
                        $("#cost").html("0.0000 EOS");
                    }
                })
            }
            setTimeout(app._fetchUser, 10000)
        },
        _initEvent: function () {
            //scatter插件加载
            document.addEventListener('scatterLoaded', function (scatterExtension) {
                scatter = window.scatter;
                eos = scatter.eos(network, Eos, {}, "https");
            });

            //检测scatters是否安装
            setTimeout(function () {
                if (!localStorage.getItem('account') && !scatter) {
                    Dialog.init("请先安装 Scatter!");
                    return;
                }
            }, 10000);

            //监听选择的队伍
            $("#redTeam").click(function () {
                seletedTeam = "red";
                $("#selectedTeam").html("你选择了红队 !");
            });
            $("#blueTeam").click(function () {
                seletedTeam = "blue";
                $("#selectedTeam").html("你选择了蓝队 !");
            });


            //快捷押key
            $("#btnAdd1").click(function () {
                app._addKeys(100);
            });
            $("#btnAdd2").click(function () {
                app._addKeys(200);
            });
            $("#btnAdd5").click(function () {
                app._addKeys(500);
            });
            $("#btnAdd10").click(function () {
                app._addKeys(1000);
            });
            $("#btnAdd100").click(function () {
                app._addKeys(10000);
            });


            //下单购买
            $("#tixBuy").click(function () {
                if (!localStorage.getItem('account') && !scatter && !isTP) {
                    Dialog.init("请先安装 Scatter!");
                    return;
                }

                if (!seletedTeam) {
                    Dialog.init('请选择一个队伍');
                    return
                }

                if (isNaN(money)) {
                    Dialog.init('请输入数额!');
                    return
                }

                var minKeys = 100;

                if ($("#keysToBuy").val() < minKeys) {
                    Dialog.init('at least ' + minKeys + ' keys!');
                    $("#keysToBuy").val(minKeys)
                    return
                }

                var memo = seletedTeam;

                scatter.getIdentity({accounts: [network]}).then(function (identity) {
                    var account = identity.accounts[0];
                    var options = {
                        authorization: account.name + '@' + account.authority,
                        broadcast: true,
                        sign: true
                    };
                    eos.transfer(account.name, teamAccount, money.toFixed(4) + ' EOS', memo, options).then(function (tx) {
                        Dialog.init("购买成功!");
                    }).catch(function (e) {
                        e = JSON.parse(e);
                        Dialog.init('Tx failed: ' + e.error.details[0].message);
                    })
                    doLoginSuccess(identity);
                })

            });


            //登录
            $("#log-btn").click(function () {
                if (!localStorage.getItem('account') && !scatter) {
                    Dialog.init("Please install Scatter!");
                    return;
                }

                if ($(this).html() == "Logout") {
                    scatter.forgetIdentity().then(function () {
                        doLogoutSuccess();
                    });
                } else {
                    localStorage.removeItem('account');
                    scatter.getIdentity({accounts: [network]}).then(function (identity) {
                        doLoginSuccess(identity);
                    }).catch(function (e) {
                        console.log(e);

                    });
                }
            });
        },
        //获取eos当前价格
        _fetchEosPrice: function () {
            $.get('https://api.huobi.pro/market/detail?symbol=eosusdt', function (data) {
                data = JSON.parse(data);
                eosPrice = data.tick.close;
            })
        },
        //押key
        _addKeys: function (val) {
            if (!roundKey) {
                Dialog.init("获取key失败");
                return;
            }
            var oldVal = $("#keysToBuy").val();
            oldVal = parseInt(oldVal);
            var newVal = oldVal + val;
            $("#keysToBuy").val(newVal);
            money = app._calMoney(newVal, roundKey);
            $("#current-money").html("@ " + money + " EOS");
        },
        //计算当前key需要付出的eos
        _calMoney: function (keysToBuy, currentKeys) {
            function getEos(key) {
                var val = new BigNumber(key);
                val = val.plus(479999);
                val = val.pow(2).minus(new BigNumber("230399520000")).dividedToIntegerBy("1280000");
                return val.toString();
            }

            var _ = getEos(new BigNumber(currentKeys).plus(keysToBuy)) - getEos(currentKeys);
            return Math.floor(_ * 1.05) / 10000;
        }
    };

    app.init();







    function doLoginSuccess(identity) {
        var account = identity.accounts[0];
        console.log(account)
        localStorage.setItem('account', JSON.stringify(account));
        $("#log-btn").html("Logout");
        $("#refUrl").html("https://gameworldeos.github.io?ref=" + account.name);
        $(".scatter").hide();
        return account;
    }

    function doLogoutSuccess() {
        localStorage.removeItem('account');
        $("#log-btn").html("Login With Scatter");
        $("#your-keys").html("0.00");
        $("#scammed").html("0.0000 EOS");
        $("#advice").html("0.0000 EOS");
        $(".gains").html("0.0000 EOS");
        $(".gains-usdt").html("≙ 0.00 USDT");
        $("#cost").html("0.0000 EOS");
        $("#refUrl").html("https://gameworldeos.github.io?ref=eos_account_name");
        $(".scatter").show();
    }

    function IsPC() {
        var userAgentInfo = navigator.userAgent;
        var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    }

    function convertToLocalTime(s) {
        var timedate = new Date(s * 1000);
        if (!IsPC()) {
            return timedate;
        }

        var d = new Date();
        var offset = d.getTimezoneOffset() / 60;

        timedate.setTime(timedate.getTime() - offset * 3600 * 1000);
        return timedate;
    }

    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function displayTimeDelta(seconds) {
        var hour = parseInt(seconds / 60 / 60);
        var minute = parseInt(seconds / 60 % 60);
        var second = parseInt(seconds % 60);
        hour = checkTime(hour);
        minute = checkTime(minute);
        second = checkTime(second);
        return hour + ":" + minute + ":" + second;
    }

    function showTime() {


        $('#startedContainer').show();
        $('#toStartContainer').hide();

        if (endTime) {
            var seconds = parseInt(new Date(endTime).getTime() - new Date().getTime()) / 1000;
            if (seconds <= 0 && !isEnded) {
                $("#headtimer").html("Your network may have problems!");
                $("#boxtimer").html("Your network may have problems!");
                return
            }

            var leftTime = displayTimeDelta(seconds);

            $("#headtimer").html(leftTime);
            $("#boxtimer").html(leftTime);
        }
        setTimeout(showTime, 1000)
    }

    showTime();
});