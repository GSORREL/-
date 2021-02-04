//index.js
//获取应用实例
const app = getApp();
const common = require("../../utils/util.js");
const requestUtil = require("../../utils/requestUtil.js");
const feeUtil = require("../../utils/feeUtil.js");
const nbFeeUtils = require("../../utils/nbFeeUtils");
const nbFeeUtils2 = require("../../utils/nbFeeUtils2");
const nbFeeUtils3 = require("../../utils/nbFeeUtils3");

var QQMapWX = require('../../utils/qqmap-wx-jssdk.js');
var qqmapsdk;

var interval;
var timer; //已停时间倒计时
var timeout; //付费后免费时间倒计时
// var seconds; //付费后免费倒计时秒数

Page({
  data: {
    // adsImgs:[
    //     {url:'../../images/banner_img.png'},
    // ],
    carouselInfoList: [], //轮播图数据
    adsIndicatorDots: false, //是否显示面板指示点
    currentSwiper: 0,
    adsAutoplay: true, //是否自动切换
    adsInterval: 3000, //自动切换时间间隔
    adsDuration: 500, //滑动动画时长
    hasUserCar: false,
    avatarDefaultUrl: "../../images/head_moren.png",
    indicatorDots: false,
    vertical: false,
    autoplay: false,
    interval: 3000,
    duration: 500,
    swiperCurrent: 0,
    nonet: true,
    vehicleInfoList: [],
    ishiddenRepycount: true, //是否隐藏欠费补缴数
    repaytotalcount: 0,
    frompage: 1,
    activityNow: {}, //新人礼活动详情
    aroundFloatLayerAD: [], //弹出的礼包图片
    floatLayerAD: !1,
    noShowAD: true,
    showQfTip: !1, //欠费提醒对话框
    //showTopayTip:!1, //我要缴费提醒对话框
    // favModal: {
    //     tagName: "",
    //     show: !1 //不显示  ！0显示
    // },
    isRefreshData: false, //是否是第一次刷新
    isClearTimer: true, //已停时间是否已经清除,默认被清除
    title: "",


      isCharge:'',//是否开通充电桩
    province: '',
    city: '',
    latitude: '',
    longitude: '',
      district: '',
      adcode:'',
      state:'',//充电桩订单状态
      uuid:''
  },

  onLoad: function () {
    qqmapsdk = new QQMapWX({
      key: 'TQSBZ-VUCLD-5GW42-HT7DQ-6JTYF-DTBUP' //这里自己的key秘钥进行填充
    });
  },
  onShow: function () {
    let vm = this;
    vm.getUserLocation();
    // vm.getRegionSetting();
    // vm.getChargeState();//获取当前账号最后充电状态
  },

  getUserLocation: function () {
    let vm = this;
    wx.getSetting({
      success: (res) => {
        console.log(JSON.stringify(res))
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      vm.getLocation();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          vm.getLocation();
        }
        else {
          //调用wx.getLocation的API
          vm.getLocation();
        }
          vm.getLocation();
      }
    })
  },
  // 微信获得经纬度
  getLocation: function () {
    let vm = this;
    wx.getLocation({
      type: 'wgs84',
      success: function (res) {
        console.log(JSON.stringify(res))
        var latitude = res.latitude
        var longitude = res.longitude
        var speed = res.speed
        var accuracy = res.accuracy;
        vm.getLocal(latitude, longitude)
      },
      fail: function (res) {
        console.log('fail' + JSON.stringify(res))
      }
    })
  },
  // 获取当前地理位置
  getLocal: function (latitude, longitude) {
    let vm = this;
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        vm.getRegionSetting();
          console.log('测试:',res);
          let province = res.result.ad_info.province
          let city = res.result.ad_info.city
          let district = res.result.ad_info.district
          let adcode = res.result.ad_info.adcode
          //朗东经纬度(29.873457, 121.621212)
          if(adcode == '330212'){
              let distance = vm.GetDistance(latitude,longitude,'121.621212','29.873457');
              if(distance >1000){
                  //鄞州优泊
                  adcode = '330212B'
              }else{
                  //东部新城
                  adcode = '330212A'
              }
          }
          vm.setData({
              province: province,
              city: city,
              district: district,
              latitude: latitude,
              longitude: longitude,
              adcode : adcode,
          })
          wx.setStorageSync("regioncode", adcode);
          // vm.getRegion();
          // vm.getStationListByGps(longitude,latitude);
          // debugger

      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        // console.log(res);
      }
    });
  },

    //根据分区号获取配置信息
    getRegionSetting:function(){
        let that = this;
        var utoken = wx.getStorageSync("utoken");
        var regioncode = wx.getStorageSync("regioncode");
        requestUtil.httpPost(
            "getRegionSetting",
            {
                utoken: utoken,
                regioncode:'330212A',
                // regioncode:regioncode,
            },
            data => {
                var isCharge = data.is_charge;//1开通充电桩功能
                var optunitwallet = data.is_optunitwallet;//1开通了分区钱包
                wx.setStorageSync("isCharge", isCharge);
                that.setData({
                    isCharge : isCharge,
                })
                // that.getWallet();
                // debugger
                that.getChargeState();
            },)
    },



  noTouchMove: function() {
    return !1;
  },

  //点击关闭欠费提示框
  closeTipDialog: function() {
    var that = this;
    that.setData({
      showQfTip: !1
    });
  },

  //点击轮播图跳转
  clickBannerView: function(e) {
    var that = this;
    var carouselInfo = e.currentTarget.dataset.item;
    if (
      carouselInfo.url &&
      !common.isEmpty(carouselInfo.url) &&
      carouselInfo.url != "undefined"
    ) {
      if (carouselInfo.url.indexOf("defined-activityid") != -1) {
        var arrPara = carouselInfo.url.split("=");
        let actid = arrPara[1];
        //活动页
        //去领取详情
        wx.navigateTo({
          url: "../activedetail/activedetail?activityid=" + actid
        });
      } else if (carouselInfo.url.indexOf("https") != -1) {
        //https://www.nb-parking.com/static-html-web/feesRule/
        var title = "";
        console.log(title);
        var jumpurl = carouselInfo.url;
        wx.navigateTo({
          url:
            "/pages/mywebview/mywebview?title=" +
            title +
            "&url=" +
            jumpurl +
            "/"
        });
      } else if (carouselInfo.url.indexOf("http") != -1) {
        var title = "活动";
        var jumpurl = carouselInfo.url;
        wx.navigateTo({
          url: "/pages/mywebview/mywebview?title=" + title + "&url=" + jumpurl
        });
      }
    }
  },

  adsswiperChange: function(e) {
    var that = this;
    that.setData({
      currentSwiper: e.detail.current
    });
  },

  //获取绑定的formId
  submitInfo: function(e) {
    console.log("form_id:" + e.detail.formId);
    wx.setStorageSync("formId", e.detail.formId);
  },

  //立即绑定车辆
  addCar: function() {
    var that = this;
    var utoken = wx.getStorageSync("utoken");
    if (utoken) {
      wx.navigateTo({
        url: "../addcar/addcar"
      });
    } else {
      wx.navigateTo({
        url: "../login/login?fromtype=2"
      });
    }
  },

  swiperChange: function(e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },

  //跳转到停车记录
  gotoParkrecord: function(e) {
    var that = this;
    var vehicleInfo = e.currentTarget.dataset.item;
    //当车辆未驶入停车场时，才能点击进入停车记录
    if (vehicleInfo.parkstate == "0" && vehicleInfo.repaycount > 0) {
      wx.navigateTo({
        url: "../parkrecord/parkrecord"
      });
    }
  },

  //跳转到我的钱包
  gotoWallet: function(e) {
    var utoken = wx.getStorageSync("utoken");
    if (utoken) {
      //去欠费补缴
      wx.navigateTo({
        url: "../wallet/wallet"
      });
    } else {
      wx.showModal({
        title: "提示",
        content: "您还没绑定手机号，是否现在去绑定?",
        confirmColor: "#4897FA",
        cancelColor: "#4897FA",
        showCancel: false,
        success: function(res) {
          if (res.confirm) {
            // console.log('用户点击确定')
            wx.navigateTo({
              url: "../login/login?fromtype=2"
            });
          } else if (res.cancel) {
            // console.log('用户点击取消')
          }
        }
      });
    }
  },

  //跳转到我要缴费
  goToPay: function(e) {
    // var that = this;
    // that.setData({
    //     showTopayTip: !1
    // })
    wx.switchTab({
      url: "../paytax/paytax"
    });
  },

  //跳转到停车记录
  goParkrecord: function(e) {
    var that = this;
    // var vehicleInfo = e.currentTarget.dataset.item;
    that.setData({
      showQfTip: !1
    });
    wx.navigateTo({
      url: "../parkrecord/parkrecord"
    });
  },

  //跳转到支付页面进行支付
  gotoParkpay: function(e) {
    var that = this;
    var vehicleInfo = e.currentTarget.dataset.item;
    var payqf =
      vehicleInfo.paymenttotal -
      (vehicleInfo.payment + vehicleInfo.paypreferential);

    if (payqf > 0 && vehicleInfo.parkbusinesstype == "11") {
      var arriveTime = new Date(vehicleInfo.parktimestr.replace(/\-/g, "/"));
      var leaveTime = new Date();
      // var paytotal = feeUtil.calculateFee(arriveTime, leaveTime,vehicleInfo.ratetype, "330200");
      //   var paytotal = nbFeeUtils.parkingFee(vehicleInfo.ratetype,arriveTime,leaveTime);
      var paytotal = nbFeeUtils3.parkingFee(
        vehicleInfo.ratetype,
        arriveTime,
        leaveTime,
        vehicleInfo.hphm
      );
      vehicleInfo.paymenttotal = paytotal;
      //以分为单位,总共需要付多少钱

      var sumMoney =
        paytotal - (vehicleInfo.payment + vehicleInfo.paypreferential);

      var businesstype = vehicleInfo.businesstype;
      var uuid = vehicleInfo.uuid;
      console.log(uuid);
      console.log(businesstype);
      if (businesstype == 2) {
        requestUtil.httpPost(
          "xcxApi/parkpot/getParkpotBusinessFee",
          {
            utoken: wx.getStorageSync("utoken"),
            uuid: uuid
          },
          data => {
            let parkpayment = common.fentoyuan(
              data.paymenttotal - data.payment - data.paypreferential
            );
            sumMoney = parkpayment;
          },
          this,
          {}
        );
      }
      console.log(sumMoney);

      // vehicleInfoList[i].isActivePay = false;
      // that.setData({
      //     isActivePay:  false
      // })
      //跳转支付页面
      wx.navigateTo({
        url:
          "../paypark/paypark?fromtype=1&paytime=" +
          common.formatTime4(new Date()) +
          "&totalsum=" +
          sumMoney +
          "&vehicleinfo=" +
          JSON.stringify(vehicleInfo)
      });
    }
  },

    //充电桩跳转到支付页面
    toPay:function(){
        let payType = 0;
        let that = this;
        console.log('uuid:',that.data.uuid)
        wx.navigateTo({
            url:'../chargingPilePage/pay/pay?payType='+ payType + '&uuid=' + that.data.uuid,
        })
    },

  //自动支付打开开关
  switchZdzf: function(e) {
    var that = this;
    var index = e.target.dataset.index;
    var vehicleInfoList = that.data.vehicleInfoList;
    var isautopay = vehicleInfoList[index].isautopay;
    if (isautopay == "1") {
      wx.showModal({
        title: "确认关闭自动支付功能吗？",
        content: "关闭自动支付，车辆离开将不能自动使用钱包里的余额支付",
        confirmColor: "#209FD1",
        cancelColor: "#209FD1",
        success: function(res) {
          if (res.confirm) {
            console.log("用户点击确定");
            that.settingAutoPaySwitch(index, "0");
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        }
      });
    } else {
      that.settingAutoPaySwitch(index, "1");
      // vehicleInfoList[index].isautopay = '1';
      // that.setData({
      //   vehicleInfoList: vehicleInfoList,
      // })
    }
  },

  //车辆自动支付开关设置
  settingAutoPaySwitch(index, autopay) {
    var that = this;
    var utoken = wx.getStorageSync("utoken");
    var vehicleInfoList = that.data.vehicleInfoList;
    var vechicleInfo = that.data.vehicleInfoList[index];

    requestUtil.httpPost(
      "account/settingAutoPaySwitch",
      {
        utoken: utoken,
        hpzl: vechicleInfo.hpzl,
        hphm: vechicleInfo.hphm,
        autopay: autopay
      },
      data => {
        common.showSuccess("设置成功", 1000);
        //刷新设置数据
        vehicleInfoList[index].isautopay = autopay;
        that.setData({
          vehicleInfoList: vehicleInfoList
        });
      },
      this,
      {
        isShowLoading: true,
        loadingText: "正在设置..."
      }
    );
  },

  onLoad: function(options) {
    var that = this;
    // wx.getSystemInfo({
    //     success: function (res) {
    //         console.info(res.windowHeight);
    //         that.setData({
    //             scrollHeight: res.windowHeight
    //         });
    //     }
    // });
    if (
      options.frompage &&
      options.frompage != "" &&
      options.frompage != "undefined"
    ) {
      var frompage = options.frompage;
      that.setData({
        frompage: frompage
      });
    }
    //  //获取登录以后用户信息
    //  var utoken = wx.getStorageSync("utoken")
    //  var mobilenum = wx.getStorageSync("mobilenum")
    //  if (utoken) { //已绑定

    //  }
  },

    //获取当前账号最后充电状态
    getChargeState:function(){
        let that = this;
        var utoken = wx.getStorageSync("utoken");
        requestUtil.httpPost(
            "getChargeState",
            {
                utoken : utoken,
            },
            (data) => {
                var state = data.state; //0空闲 1充电中 2有欠费的充电记录
                var uuid = data.uuid; //充电订单编号
                var connectorid = data.connectorid //设备编码
                wx.setStorageSync("state", state);
                wx.setStorageSync("uuid", uuid);
                wx.setStorageSync("connectorid", connectorid);
                that.setData({
                    state : state,
                    uuid : uuid,
                })

            },)
    },

  //测试费用
  testFee(strarriveTime, strleaveTime2) {
    // app.globalData.freeTime  = 30;
    var arriveTime = new Date(strarriveTime);
    var leaveTime = new Date(strleaveTime2);
    // var paytotal = feeUtil.calculateFee(arriveTime, leaveTime,"2", "330200");
    // var paytotal = nbFeeUtils3.parkingFee("2",arriveTime,leaveTime,"浙BK023A");
    // var paytotal = nbFeeUtils3.parkingFee("11",arriveTime,leaveTime,"浙B767UE");
    var paytotal = nbFeeUtils3.parkingFee(
      "13",
      arriveTime,
      leaveTime,
      "浙B767UE"
    );
    // var paytotal = nbFeeUtils3.parkingFee("1",arriveTime,leaveTime,"浙B767UE");
    // var paytotal = nbFeeUtils.parkingFee("11",arriveTime,leaveTime);
    // var paytotal = nbFeeUtils2.parkingFee("11",arriveTime,leaveTime);
    var strPaymenttotal = common.fentoyuan(paytotal);
    console.log(
      "计费:" + arriveTime + " - " + leaveTime,
      strPaymenttotal + "元"
    );
  },


    //计算时间差
    getTime:function(st,s){
        st = st.replace(/\-/g, "/");
        // et = et.replace(/\-/g, "/");
        var date1 =(new Date(st)).getTime(); //开始时间
        var date2 =date1 + s*1000; //结束时间
        var time1 = new Date(date2);//时间差的毫秒数
// debugger
        let month =time1.getMonth() + 1 < 10? "0" + (time1.getMonth() + 1): time1.getMonth() + 1;
        let date =time1.getDate() < 10? "0" + time1.getDate(): time1.getDate();
        let hh =time1.getHours() < 10? "0" + time1.getHours(): time1.getHours();
        let mm =time1.getMinutes() < 10? "0" + time1.getMinutes(): time1.getMinutes();
        let nowTime =  month + "-" + date + " "+hh+":"+mm ;
        return nowTime;
    },

  onShow: function() {
    var that = this;
    that.refreshData();
  },

  //页面隐藏
  onHide: function() {
    // if (interval){
    //   clearInterval(interval);
    // }
    var that = this;
    if (timer) {
      clearTimeout(timer);
      that.setData({
        isClearTimer: true
      });
    }

    if (timeout) {
      clearTimeout(timeout);
    }
  },

  //页面destory
  onUnload: function() {
    var that = this;
    if (timer) {
      clearTimeout(timer);
      that.setData({
        isClearTimer: true
      });
    }
    if (timeout) {
      clearTimeout(timeout);
    }
  },

  //刷新数据
  refreshData: function() {
    var that = this;
    var isRefreshData = that.data.isRefreshData;
    var obj = {};
    //获取轮播图
    that.getCarouselList(true);
    that.getChargeState();
    common.isNet(true, function(data) {
      var utoken = wx.getStorageSync("utoken");
      var mobilenum = wx.getStorageSync("mobilenum");
      //已绑定
      if (utoken) {
        //获取轮播图
        //that.getCarouselList(true);
        //获取绑定车辆
        if (!isRefreshData) {
          //需要加载对话框
          that.getVehicleList(false);
        } else {
          //第二次不需要弹出加载对话框
          that.getVehicleList(true);
        }
      } else {
        //未绑定，清空数据
        that.setData({
          hasUserCar: false,
          vehicleInfoList: [],
          ishiddenRepycount: true, //是否隐藏欠费补缴数
          repaytotalcount: 0
        });

        //登录用户
        requestUtil.login({
          success: function(res) {
            //已绑定过手机号的用户返回
            //  console.log(res);
            var utoken = wx.getStorageSync("utoken");
            console.log("utoken:" + utoken);
            //获取轮播图
            //that.getCarouselList(true);
            //获取绑定车辆
            if (!isRefreshData) {
              //需要加载对话框
              that.getVehicleList(false);
            } else {
              //第二次不需要弹出加载对话框
              that.getVehicleList(true);
            }
          },
          complete: function(res) {},
          isShowLoading: true,
          fromtype: 2
        });
      }
    });
  },

  //获取轮播图
  getCarouselList(isRefresh = true) {
    var that = this;
    var utoken = wx.getStorageSync("utoken");
    if (!isRefresh) {
      common.showLoading("正在获取轮播图...");
    }

    requestUtil.httpPost(
      "account/getCarouselList",
      {
        //  'utoken': utoken,
        // 'mmodule':'app',
        mmodule: "wxxcx"
      },
      data => {
        //获取轮播图成功
        // common.showSuccess("获取轮播图成功", 1000);
        if (data.totalcount > 0) {
          let carouselInfoList = data.list;
          that.setData({
            carouselInfoList: carouselInfoList
          });
        } else {
          that.setData({
            carouselInfoList: []
          });
        }

        //获取新人礼活动
        // that.getActivityNow();
      },
      this,
      {
        isShowLoading: false,
        completeAfter: function(res) {
          if (!isRefresh) {
            common.hideToast();
          } else {
            setTimeout(function() {
              wx.stopPullDownRefresh();
            }, 1000);
          }

          that.setData({
            currentSwiper: 0
          });
        }
      }
    );
  },

  //获取新人礼活动
  getActivityNow(isRefresh = true) {
    var that = this;
    var isRefreshData = that.data.isRefreshData;
    var utoken = wx.getStorageSync("utoken");
    if (!isRefresh) {
      common.showLoading("正在获取新人礼活动...");
    }

    //获取绑定车辆
    if (!isRefreshData) {
      //需要加载对话框
      that.getVehicleList(false);
    } else {
      //第二次不需要弹出加载对话框
      that.getVehicleList(true);
    }
  },

  /**
   * 跳转到问题反馈
   */
  gotoFeedbackList() {
    var that = this;
    //提示再未开放
    common.alertView("提示", "对不起，目前该功能未开放!", function() {});
  },

  /**
   * 我要缴费
   */
  gotoPaytax() {
    var that = this;
    var mobilenum = wx.getStorageSync("mobilenum");
    var isOneClick = wx.getStorageSync(mobilenum + "_isOneClick");
    if (isOneClick && isOneClick == "1") {
      wx.switchTab({
        url: "../paytax/paytax"
      });
    } else {
      //首次点击弹出提示框
      // that.setData({
      //     showTopayTip: 1
      // })
      // wx.setStorageSync(mobilenum+'_isOneClick', '1');
    }
  },

  //获取已绑定的车辆
  getVehicleList(isRefresh = false) {
    var that = this;
    var isClearTimer = that.data.isClearTimer;
    var utoken = wx.getStorageSync("utoken");
    if (!isRefresh) {
      common.showLoading("正在获取已绑定的车辆...");
    }
    requestUtil.httpPost(
      "account/getVehicleList",
      {
        utoken: utoken,
        form_id: wx.getStorageSync("formId")
      },
      data => {
        //获取车辆成功
        // common.showSuccess("获取绑定车辆成功", 1000);
        if (data.totalcount > 0) {
          wx.setStorageSync("carcount", data.totalcount);
          let vehicleInfoList = data.list;
          let repaytotalcount = 0;
          let repaycount_warn = data.repaycount_warn; //欠费超过3天的记录数()



          for (var i in vehicleInfoList) {
            //计算最新的刷新时间
              let time = vehicleInfoList[i].parktimestr;
              let hodingsecond = vehicleInfoList[i].hodingsecond;
              let date = that.getTime(time,hodingsecond);
              vehicleInfoList[i].date = date;
              console.log('时间1:')

// debugger
            //计算欠费补缴总数
            repaytotalcount += vehicleInfoList[i].repaycount;
            var authenticatedstate = vehicleInfoList[i].authenticatedstate;
            var parkstate = vehicleInfoList[i].parkstate;
            var hphm;
            var parkname;
            if (vehicleInfoList[i].businesstype == "1") {
              vehicleInfoList[i].park = "停车点";
            } else if (vehicleInfoList[i].businesstype == "2") {
              vehicleInfoList[i].park = "停车场";
            }
            // if (authenticatedstate == '0') { //未认证
            //   hphm = common.getCarNumber(vehicleInfoList[i].hphm);
            //   parkname = "***停车场";
            // } else {//已认证
            //   hphm = vehicleInfoList[i].hphm;
            //   parkname = vehicleInfoList[i].parkname;
            // }
            // hphm=vehicleInfoList[i].hphm;
            // parkname=vehicleInfoList[i].parkname;
            // vehicleInfoList[i].hphm2 = hphm;
            // vehicleInfoList[i].parkname2 = parkname;
            hphm = vehicleInfoList[i].hphm;
            vehicleInfoList[i].hphm1 = hphm.substring(0, 2);
            vehicleInfoList[i].hphm2 = hphm.substring(2, hphm.length);

            if (
              !common.isEmpty(vehicleInfoList[i].parktimestr) &&
              vehicleInfoList[i].parktimestr != ""
            ) {
              var date = new Date(
                vehicleInfoList[i].parktimestr.replace(/-/g, "/")
              );
              console.log(date);
              vehicleInfoList[i].parktimedate = common.formatTime3(date);
              vehicleInfoList[i].parktimetime = common.formatTime6(date);
              vehicleInfoList[i].parktimestr = common.formatTime7(date);
            } else {
              vehicleInfoList[i].parktimedate = "";
              vehicleInfoList[i].parktimetime = "";
              vehicleInfoList[i].parktimestr = "";
            }

            //刷新正在停车的状态
            that.setData({
              vehicleInfoList: vehicleInfoList
            });

            if (parkstate == "1") {
              //正在停车状态
              vehicleInfoList = that.refreshParking(i, 1);

              //开启定时任务，定时计费(第一次刷新车辆绑定)
              // if (isClearTimer) {
              //   that.calParking();
              //   that.setData({
              //     isClearTimer: false
              //   });
              // }
            } else {
              //车辆离开
              if (timeout) {
                clearTimeout(timeout);
              }
              //倒计时开始
              vehicleInfoList[i].free = "正在计算什么时候计费...";
              vehicleInfoList[i].isShowPay = true;
              that.countTime(i, 0);
            }
          }

          if (repaytotalcount > 0) {
            that.setData({
              ishiddenRepycount: false,
              repaytotalcount: repaytotalcount
            });
          } else {
            that.setData({
              ishiddenRepycount: true,
              repaytotalcount: 0
            });
          }

          //有欠费记录超过3天的记录数
          var repaycountwarn = 0;
          repaycountwarn = wx.getStorageSync("repaycountwarn");
          if (repaycount_warn > 0) {
            var qftx = wx.getStorageSync("qftx");
            if (qftx != 1 || repaycount_warn > repaycountwarn) {
              //显示弹出对话框
              that.setData({
                showQfTip: 1
              });
              wx.setStorageSync("qftx", 1);
            }
          }
          wx.setStorageSync("repaycountwarn", repaycount_warn);

          //存储绑定的车辆
          wx.setStorageSync("bindcars", vehicleInfoList);

          that.setData({
            vehicleInfoList: vehicleInfoList,
            hasUserCar: true
          });
        } else {
          that.setData({
            vehicleInfoList: [],
            hasUserCar: false,
            ishiddenRepycount: true,
            repaytotalcount: 0
          });
        }
      },
      this,
      {
        isShowLoading: false,
        completeAfter: function(res) {
          if (!isRefresh) {
            common.hideToast();
            that.setData({
              isRefreshData: true
            });
          } else {
            setTimeout(function() {
              wx.stopPullDownRefresh();
            }, 1000);
          }
        }
      }
    );
  },

  //计算停车费用
  calParking() {
    var that = this;
    timer = setTimeout(function() {
      let isChanged = false;
      let vehicleInfoList = that.data.vehicleInfoList;
      for (var i in vehicleInfoList) {
        var parkstate = vehicleInfoList[i].parkstate;
        if (parkstate == "1") {
          //正在停车状态
          isChanged = true;
          //与当前时间相比已停几分钟
          //   console.log("已停"+vehicleInfoList[i].parktimestr)
          var timepark = common.getTimeForPark(vehicleInfoList[i].parktimestr);
          // console.log("已停"+timepark)
          vehicleInfoList[i].hodingtime = timepark;
          var hodingsecond = common.getSecondTimeForPark(
            vehicleInfoList[i].parktimestr
          );
          vehicleInfoList[i].hodingsecond = hodingsecond;
          that.setData({
            vehicleInfoList: vehicleInfoList
          });
          //刷新正在停车的状态
          vehicleInfoList = that.refreshParking(i, 2);
        } else {
          //没有停车状态

          if (timeout) {
            // (function(timeout) {
            //     clearTimeout(timeout);
            // })(i)
            clearTimeout(timeout);
          }
          //倒计时开始
          vehicleInfoList[i].free = "正在计算什么时候计费...";
          vehicleInfoList[i].isShowPay = true;
          that.countTime(i, 0);
        }
      }

      if (isChanged) {
        isChanged = false;
        //刷新停车数据
        that.setData({
          vehicleInfoList: vehicleInfoList,
          hasUserCar: true
        });
      }
      that.calParking();
    }, 1000 * 60);
  },

  //正在停车状态改变(fromtype 1、下拉刷新 2、计算过来)
  refreshParking: function(i, fromtype) {
    var that = this;
    var vehicleInfoList = that.data.vehicleInfoList;

    //已停几分钟
    if (vehicleInfoList[i].hodingtime > 0) {
      var hodingtime = common.getHoldingTime(vehicleInfoList[i].hodingtime);
      vehicleInfoList[i].parktime = hodingtime;
    } else {
      vehicleInfoList[i].parktime = "0分";
    }

    vehicleInfoList[i].free = "正在计算什么时候计费...";

    //计算免费时长
    var freeminutes = 3;
    if (vehicleInfoList[i].businesstype == "1") {
      //路内
      freeminutes = 3;
    } else if (vehicleInfoList[i].businesstype == "2") {
      //路外
      freeminutes = 15;
    }

    //免费时长计算 付费时长大于已停时长
    if (vehicleInfoList[i].freesecond > vehicleInfoList[i].hodingsecond) {
      vehicleInfoList[i].hodingsecond = vehicleInfoList[i].freesecond;
    }

    var freetime =
      freeminutes * 60 -
      (vehicleInfoList[i].hodingsecond - vehicleInfoList[i].freesecond);

    //计算过来的，需要判断是否需要计费
    if (fromtype == 2) {
      //应付金额等于已付+优惠金额
      if (
        vehicleInfoList[i].paymenttotal ==
        vehicleInfoList[i].payment + vehicleInfoList[i].paypreferential
      ) {
        if (freetime < 0) {
          //没有免费时长,开始计费
          var arriveTime = new Date(
            vehicleInfoList[i].parktimestr.replace(/\-/g, "/")
          );
          var leaveTime = new Date();
          // var paytotal = feeUtil.calculateFee(arriveTime, leaveTime,vehicleInfoList[i].ratetype,"330200");
          //   var paytotal = nbFeeUtils.parkingFee(vehicleInfoList[i].ratetype,arriveTime,leaveTime);
          var paytotal = nbFeeUtils3.parkingFee(
            vehicleInfoList[i].ratetype,
            arriveTime,
            leaveTime,
            vehicleInfoList[i].hphm
          );
          vehicleInfoList[i].paymenttotal = paytotal;
        }
      } else {
        //直接计费
        var arriveTime = new Date(
          vehicleInfoList[i].parktimestr.replace(/\-/g, "/")
        );
        var leaveTime = new Date();
        // var paytotal = feeUtil.calculateFee(arriveTime, leaveTime,vehicleInfoList[i].ratetype,"330200");
        //   var paytotal = nbFeeUtils.parkingFee(vehicleInfoList[i].ratetype,arriveTime,leaveTime);
        var paytotal = nbFeeUtils3.parkingFee(
          vehicleInfoList[i].ratetype,
          arriveTime,
          leaveTime,
          vehicleInfoList[i].hphm
        );
        vehicleInfoList[i].paymenttotal = paytotal;
      }
    }
    //计费完成再刷新数据
    //有已付金额
    if (vehicleInfoList[i].payment > 0) {
      vehicleInfoList[i].pay = common.fentoyuan(vehicleInfoList[i].payment);
    } else {
      vehicleInfoList[i].pay = 0;
    }

    //优惠金额
    if (vehicleInfoList[i].paypreferential > 0) {
      vehicleInfoList[i].paypre = common.fentoyuan(
        vehicleInfoList[i].paypreferential
      );
    } else {
      vehicleInfoList[i].paypre = 0;
    }

    //应付金额大于0
    if (vehicleInfoList[i].paymenttotal > 0) {
      let paymenttotal = common.fentoyuan(vehicleInfoList[i].paymenttotal);
      vehicleInfoList[i].total = paymenttotal;

      //应付金额等于已付金额
      if (
        vehicleInfoList[i].paymenttotal ==
        vehicleInfoList[i].payment + vehicleInfoList[i].paypreferential
      ) {
        vehicleInfoList[i].qf = 0;
        //普通到达
        if (vehicleInfoList[i].parkbusinesstype == "11") {
          vehicleInfoList[i].isShowPay = false;
          vehicleInfoList[i].isActivePay = false;

          //有免费时长
          if (freetime >= 0) {
            // seconds = freetime;
            if (timeout) {
              clearTimeout(timeout);
            }
            //倒计时开始
            vehicleInfoList[i].isShowPay = false;
            that.countTime(i, freetime);
          } else {
            vehicleInfoList[i].isShowPay = true;
            vehicleInfoList[i].txtpay = "立即支付";
            vehicleInfoList[i].isActivePay = false;
            if (timeout) {
              clearTimeout(timeout);
            }
          }
        } else {
          //其他类型到达
          vehicleInfoList[i].isShowPay = true;
          vehicleInfoList[i].isActivePay = false;
          switch (vehicleInfoList[i].parkbusinesstype) {
            case "12": //包月到达
              vehicleInfoList[i].txtpay = "包月车辆";
              break;
            case "13": //企业包月到达
              vehicleInfoList[i].txtpay = "企业车辆";
              break;
            case "14": //产权车到达
              vehicleInfoList[i].txtpay = "产权车辆";
              break;
            default:
              vehicleInfoList[i].txtpay = "包月车辆";
              break;
          }
        }
      } else {
        if (
          vehicleInfoList[i].paymenttotal >
          vehicleInfoList[i].payment + vehicleInfoList[i].paypreferential
        ) {
          let qf = common.fentoyuan(
            vehicleInfoList[i].paymenttotal -
              (vehicleInfoList[i].payment + vehicleInfoList[i].paypreferential)
          );
          vehicleInfoList[i].qf = qf;
          //普通到达
          if (vehicleInfoList[i].parkbusinesstype == "11") {
            vehicleInfoList[i].isShowPay = true;
            vehicleInfoList[i].txtpay = "立即支付";
            vehicleInfoList[i].isActivePay = true;
          } else {
            //其他类型到达
            vehicleInfoList[i].isShowPay = true;
            vehicleInfoList[i].isActivePay = false;
            switch (vehicleInfoList[i].parkbusinesstype) {
              case "12": //包月到达
                vehicleInfoList[i].txtpay = "包月车辆";
                break;
              case "13": //企业包月到达
                vehicleInfoList[i].txtpay = "企业车辆";
                break;
              case "14": //产权车到达
                vehicleInfoList[i].txtpay = "产权车辆";
                break;
              default:
                vehicleInfoList[i].txtpay = "包月车辆";
                break;
            }
          }
        } else {
          //应付<已付
          //普通到达
          if (vehicleInfoList[i].parkbusinesstype == "11") {
            vehicleInfoList[i].isShowPay = true;
            vehicleInfoList[i].txtpay = "立即支付";
            vehicleInfoList[i].isActivePay = false;
          } else {
            //如果是其他类型到达
            vehicleInfoList[i].isShowPay = true;
            vehicleInfoList[i].isActivePay = false;
            switch (vehicleInfoList[i].parkbusinesstype) {
              case "12": //包月到达
                vehicleInfoList[i].txtpay = "包月车辆";
                break;
              case "13": //企业包月到达
                vehicleInfoList[i].txtpay = "企业车辆";
                break;
              case "14": //产权车到达
                vehicleInfoList[i].txtpay = "产权车辆";
                break;
              default:
                vehicleInfoList[i].txtpay = "包月车辆";
                break;
            }
          }
        }
      }
    } else {
      //没有应付
      //应付金额(元)
      let paymenttotal = common.fentoyuan(vehicleInfoList[i].paymenttotal);
      vehicleInfoList[i].total = paymenttotal;
      vehicleInfoList[i].qf = 0;
      vehicleInfoList[i].isShowPay = true;
      vehicleInfoList[i].isActivePay = false;
      switch (vehicleInfoList[i].parkbusinesstype) {
        case "11":
          vehicleInfoList[i].txtpay = "立即支付";
          break;
        case "12": //包月到达
          vehicleInfoList[i].txtpay = "包月车辆";
          break;
        case "13": //企业包月到达
          vehicleInfoList[i].txtpay = "企业车辆";
          break;
        case "14": //产权车到达
          vehicleInfoList[i].txtpay = "产权车辆";
          break;
        default:
          vehicleInfoList[i].txtpay = "包月车辆";
          break;
      }
    }
    return vehicleInfoList;
  },

  //倒计时方法
  countTime(i, freetime) {
    var that = this;
    var vehicleInfoList = that.data.vehicleInfoList;
    if (common.isEmpty(vehicleInfoList) || vehicleInfoList.length == 0) {
      return;
    }
    var seconds = freetime; //付费后免费倒计时秒数

    //递归每秒调用countTime方法，显示动态时间效果
    timeout = setTimeout(function() {
      seconds--;
      var formatTimeStr = common.fromatTimeStr(seconds);
      //显示时间数据
      if (
        vehicleInfoList[i].free &&
        vehicleInfoList[i].free != "" &&
        vehicleInfoList[i].free != "undefined"
      ) {
        vehicleInfoList[i].free = formatTimeStr + " 后将继续计费";
      }
      that.setData({
        vehicleInfoList: vehicleInfoList
        // curVehiclePos:i,
      });

      //结束倒计时
      if (seconds < 0) {
        clearTimeout(timeout);
        vehicleInfoList[i].isShowPay = true;
        vehicleInfoList[i].isActivePay = false;
        vehicleInfoList[i].txtpay = "立即支付";
        that.setData({
          vehicleInfoList: vehicleInfoList
          // curVehiclePos:0,
        });
      } else {
        that.countTime(i, seconds);
      }
    }, 1000);
  },

  onPullDownRefresh: function() {
    var that = this;
    console.log("下拉刷新", new Date());
    var isRefreshData = that.data.isRefreshData;
    var utoken = wx.getStorageSync("utoken");
    //已绑定
    if (utoken) {
      //获取轮播图
      that.getCarouselList(true);
        that.getChargeState();
        //获取绑定车辆
      if (!isRefreshData) {
        //需要加载对话框
        that.getVehicleList(false);
      } else {
        //第二次不需要弹出加载对话框
        that.getVehicleList(true);
      }
    } else {
      //未绑定
      //重新登录用户
      requestUtil.login({
        success: function(res) {
          //已绑定过手机号的用户返回
          //  console.log(res);
          var utoken = wx.getStorageSync("utoken");
          var mobilenum = wx.getStorageSync("mobilenum");
          console.log("utoken:" + utoken);
          //获取轮播图
          that.getCarouselList(true);
            that.getChargeState();
        },
        complete: function(res) {
          setTimeout(function() {
            wx.stopPullDownRefresh();
          }, 1000);
        },
        fromtype: 2
      });
    }
  },

  /**
   * 用户点击右上角分享（index.js）
   */
  onShareAppMessage: function(ops) {
    if (ops.from === "button") {
      // 来自页面内转发按钮
      console.log(ops.target);
    }
    return {
      title: "甬城泊车",
      desc:
        "甬城泊车是一款停车服务软件，帮助有车族停车、查找周边停车场、找车位、泊车导航、路边停车、节省停车费！是有车一族的必备软件",
      path: "pages/index/index",
      success: function(res) {
        // 转发成功
        console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function(res) {
        // 转发失败
        console.log("转发失败:" + JSON.stringify(res));
      }
    };
  }
});
