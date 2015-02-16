"use strict";
var is_mobile = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
if (is_mobile) {
    document.addEventListener("deviceready", onDeviceReady, false);
    document.addEventListener("touchstart", function () {
    }, false);
} else {
    onDeviceReady();
}

function onDeviceReady() {
    $.mobile.defaultPageTransition = 'none';
    $.mobile.defaultDialogTransition = 'none';
    if (is_mobile) {
        push.initPushwoosh();
        window.analytics.startTrackerWithId('UA-59665096-1');
    }
}

var router = new $.mobile.Router([{
        "#register_one": {handler: "registerStepOnePage", events: "bs"},
        "#register": {handler: "registerPage", events: "bs"},
        "#verify": {handler: "verifyPage", events: "bs"},
        "#me": {handler: "mePage", events: "bs"},
        "#more": {handler: "morePage", events: "bs"},
        "#contact": {handler: "contactPage", events: "bs"},
        "#faq": {handler: "faqPage", events: "bs"},
        "#about": {handler: "aboutPage", events: "bs"},
        "#policy": {handler: "policyPage", events: "bs"},
        "#rate": {handler: "ratePage", events: "bs"},
        "#feedback": {handler: "feedbackPage", events: "bs"}
    }],
        {
            registerPage: function (type, match, ui) {
                log("Register Page", 3);
                refreshRegister();
            },
            registerStepOnePage: function (type, match, ui) {
                log("Register Step One Page", 3);
                resetMobileNo();
                if (is_mobile) {
                    window.analytics.trackView('Register Page');
                }
            },
            verifyPage: function (type, match, ui) {
                log("Verification Page", 3);
                startTimer();
                if (is_mobile) {
                    window.analytics.trackView('Verification Page');
                }
            },
            mePage: function (type, match, ui) {
                log("Me Page", 3);
                showMe();
                calcCart();
            },
            morePage: function (type, match, ui) {
                log("More page", 3);
                calcCart();
            },
            faqPage: function (type, match, ui) {
                log("FAQ page", 3);
                showFAQ();
            },
            aboutPage: function (type, match, ui) {
                log("About App page", 3);
                showAboutApp();
            },
            policyPage: function (type, match, ui) {
                log("Policy page", 3);
                showPolicy();
            },
            ratePage: function (type, match, ui) {
                log("Contact page", 3);
                setRate();
            },
            contactPage: function (type, match, ui) {
                log("Contact page", 3);
                showContact();
            },
            feedbackPage: function (type, match, ui) {
                log("Feedback Page", 3);
                showFeedbackForm();
            }
        }, {
    ajaxApp: true,
    defaultHandler: function (type, ui, page) {
        log("Default handler called due to unknown route (" + type + ", " + ui + ", " + page + ")", 1);
    },
    defaultHandlerEvents: "s",
    defaultArgsRe: true
});
$.addTemplateFormatter({
});
/**** Pre Defined Functions **/

function log(msg, level) {
    if (typeof (level) === "undefined") {
        level = 3;
    }
    var logname = {0: "Disabled", 1: "Error", 2: "Warning", 3: "Info"};
    if (level <= config.showlog) {
        console.log(logname[level] + ": " + msg);
    }
}


/********  Common Functions and Global Variables **/

var loading = '<div class="align-center"><br/><br/><img src="img/loading.gif" width="60" /></div>';

jQuery.fn.center = function () {
    this.css("position", "fixed");
    this.css("top", ($(window).height() / 2) - (this.outerHeight() / 2));
    this.css("left", ($(window).width() / 2) - (this.outerWidth() / 2));
    return this;
};

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}


/**********   Register Step One functions ***/

function validMobile() {
    $("#reg_err_one .ui-content a").attr("data-rel", "back");
    $("#reg_err_one .ui-content a").removeAttr("href");
    if ($.trim($("#mobile").val()).length < 10) {
        $("#reg_err_one_text").html("<b>Enter your 10 digit mobile number</b>");
        $("#reg_err_one").popup("open");
        return false;
    }
    return true;
}

function registerPartOne() {
    if (validMobile()) {
        $("#reg_one_spinner").empty();
        $("#reg_one_spinner").append(loading);
        var mobile = $.trim($('#mobile').val());
        var data = {mobile: mobile};
        $.ajax({
            type: "POST",
            url: config.api_url + "module=user&action=user_exist",
            data: data,
            cache: false,
            success: function (rs) {
                $("#reg_one_spinner").empty();
                if (rs.error == false) {
                    $("#reg_err_one .ui-content a").removeAttr("data-rel");
                    $("#reg_err_one .ui-content a").attr("href", "#register");
                    setVal(config.user_mobile, mobile);
                    $(":mobile-pagecontainer").pagecontainer("change", "#register");
                } else {
                    $("#reg_err_one .ui-content a").removeAttr("data-rel");
                    $("#reg_err_one .ui-content a").attr("href", "#verify");
                    setVal(config.user_name, rs.name);
                    setVal(config.user_mobile, mobile);
                    setVal(config.user_email, rs.email);
                    setVal(config.user_address1, rs.address1);
                    setVal(config.user_address2, rs.address2);
                    setVal(config.user_city, rs.city);
                    setVal(config.user_pincode, rs.pincode);
                    setVal(config.user_alternet_number, rs.alt_num);
                    setVal(config.cylinder_type, rs.gas_type);
                    setVal(config.user_status, rs.status);
                    setVal(config.user_id, rs.id);
                    $("#reg_err_one_text").html("<b>" + rs.message + "</b>");
                    $("#reg_err_one").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#reg_one_spinner").empty();
                $("#reg_err_one .ui-content a").removeAttr("href");
                $("#reg_err_one .ui-content a").attr("data-rel", "back");
                $("#reg_err_one_text").html("<b>Process fail please try again......</b>");
                $("#reg_err_one").popup("open");
            }
        });
    }
}

function resetMobileNo() {
    $("#reg_one_spinner").empty();
    if (getVal(config.user_id) != null && getVal(config.user_status) != 1) {
        $("#mobile").val(getVal(config.user_mobile));
    } else {
        $("#mobile").val("");
    }
}


/**********   Register Page functions ***/

function validRegister() {
    $("#reg_err .ui-content a").attr("data-rel", "back");
    $("#reg_err .ui-content a").removeAttr("onclick");
    if ($.trim($("#name").val()).length < 3) {
        $("#reg_err_text").html("<b>Name should be at least 3 char</b>");
        $("#reg_err").popup("open");
        return false;
    }
    if (!validateEmail($.trim(jQuery("#email").val()))) {
        $("#reg_err_text").html("<b>Please enter valid email address</b>");
        $("#reg_err").popup("open");
        return false;
    }
    if ($.trim($("#addressl1").val()).length < 3) {
        $("#reg_err_text").html("<b>Address line 1 is mandatory</b>");
        $("#reg_err").popup("open");
        return false;
    }
    if ($.trim($("#area_pin").val()).length < 6) {
        $("#reg_err_text").html("<b>Enter a valid pin code</b>");
        $("#reg_err").popup("open");
        return false;
    }
    return true;
}

function refreshRegister() {
    $("div#err_msg").center();
    $("#err_msg").empty();
    $("#name").val("");
    $("#email").val("");
    $("#addressl1").val("");
    $("#addressl2").val("");
    $("#area_pin").val("");
    $("#alt_number").val("");
}

function createCode() {
    if (validRegister()) {
        $("#err_msg").empty();
        $("#err_msg").append(loading);
        var name = $.trim($('#name').val());
        var email = $.trim($('#email').val());
        var addressl1 = $.trim($('#addressl1').val());
        var addressl2 = $.trim($('#addressl2').val());
        var pin = $.trim($('#area_pin').val());
        var alt_num = $.trim($('#alt_number').val());
        var city = $.trim($('#fix_city').val());
        var gas_type = $.trim($('#gas_type').val());
        var details = {
            name: name,
            mobile: getVal(config.user_mobile),
            email: email,
            device_token: getVal(config.device_token),
            address1: addressl1,
            address2: addressl2,
            city: city,
            pincode: pin,
            alt_num: alt_num,
            gas_type: gas_type
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=user&action=create",
            data: details,
            cache: false,
            success: function (html) {
                $("#err_msg").empty();
                if (html.error == false) {
                    $("#reg_err .ui-content a").removeAttr("data-rel");
                    $("#reg_err .ui-content a").attr("onclick", "redirectToVerify()");
                    setVal(config.user_name, name);
                    setVal(config.user_email, email);
                    setVal(config.user_address1, addressl1);
                    setVal(config.user_address2, addressl2);
                    setVal(config.user_pincode, pin);
                    setVal(config.user_alternet_number, alt_num);
                    setVal(config.cylinder_type, gas_type);
                    setVal(config.user_id, html.id);
                    setVal(config.user_status, html.status);
                    after_reg = "verify";
                    $("#reg_err_text").html("<b>" + html.message + "</b>");
                    $("#reg_err").popup("open");
                } else {
                    $("#reg_err .ui-content a").removeAttr("onclick");
                    $("#reg_err .ui-content a").attr("data-rel", "back");
                    $("#reg_err_text").html("<b>" + html.message + "</b>");
                    $("#reg_err").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#err_msg").empty();
                $("#err_msg").append("Process fail please try again......");
            }
        });
    }
}

function redirectToVerify() {
    $(":mobile-pagecontainer").pagecontainer("change", "#verify");
}


/**********   Verify Page functions ***/

function startTimer() {
    clearInterval();
    $("#resend").empty();
    var resend = '<a href="#" class="ui-btn ui-btn-corner-all" onclick="resend();"> Resend Code</a>';
    var sec = 90;
    var timer = setInterval(function () {
        $("#timer").text(sec--);
        if (sec == -1) {
            clearInterval(timer);
            $("#timer").empty();
            $("#resend").append(resend);
        }
    }, 1000);
}

function verifyCode() {
    var code = $("#code").val();
    if (code != "") {
        var details = {
            user: getVal(config.user_id),
            code: code
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=user&action=verify",
            data: details,
            cache: false,
            success: function (html) {
                if (html.error == false) {
                    $("#verify_err .ui-content a").removeAttr("data-rel");
                    $("#verify_err .ui-content a").attr("onclick", "redirectToShopping()");
                    setVal(config.user_status, html.status);
                    $("#verify_err_text").html("<b>" + html.message + "</b>");
                    $("#verify_err").popup("open");
                } else {
                    $("#verify_err_text").html("<b>" + html.message + "</b>");
                    $("#verify_err").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#err_msg").empty();
                $("#err_msg").append("Process fail please try again......");
            }
        });
    }
}

function redirectToShopping() {
    $(":mobile-pagecontainer").pagecontainer("change", "#shopping");
}

function resend() {
    var mobile = getVal(config.user_mobile);
    var email = getVal(config.user_email);
    var id = getVal(config.user_id);
    var details = {
        mobile: mobile,
        email: email,
        id: id,
        device_token: getVal(config.device_token)
    };
    startTimer();
    $.ajax({
        type: "POST",
        url: config.api_url + "module=user&action=resend",
        data: details,
        cache: false,
        success: function (html) {
            if (html.error == false) {
                $("#verify_err_text").html("<b>" + html.message + "</b>");
                $("#verify_err").popup("open");
            }
        },
        error: function (request, status, error) {
            $("#verify_err_text").html("<b>Process fail please try again......</b>");
            $("#verify_err").popup("open");
        }
    });
}


/**********   Me Page functions ***/

function showMe() {
    $("#me_loader").empty();
    $("#me_loader").center();
    var id = getVal(config.user_id);
    var name = getVal(config.user_name);
    var mobile = getVal(config.user_mobile);
    var email = getVal(config.user_email);
    if (id != null) {
        $("#me_name").val(name);
        $("#me_mobile").val(mobile);
        $("#me_email").val(email);
    }
}

function checkUpdation() {
    $("#me_loader").empty();
    var up_name = $.trim($("#me_name").val());
    var up_email = $.trim(jQuery("#me_email").val());
    var name = $.trim(getVal(config.user_name));
    var email = $.trim(getVal(config.user_email));
    if (up_name == name && up_email == email) {
        $("#update_success_text").html("<b>No informations found to update</b>");
        $("#update_success").popup("open");
        return false;
    }
    return true;
}

function validateUpdation() {
    $("#me_loader").empty();
    if ($.trim($("#me_name").val()).length < 3) {
        $("#update_success_text").html("<b>Name must be 3 characters</b>");
        $("#update_success").popup("open");
        return false;
    }
    if (!validateEmail($.trim(jQuery("#me_email").val()))) {
        $("#update_success_text").html("<b>Please enter valid email address</b>");
        $("#update_success").popup("open");
        return false;
    }
    return true;
}

function updateUser() {
    if (validateUpdation() && checkUpdation()) {
        $("#me_loader").empty();
        $("#me_loader").append(loading);
        var name = $("#me_name").val();
        var email = $("#me_email").val();
        var data = {
            name: name,
            email: email,
            id: getVal(config.user_id)
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=user&action=update",
            data: data,
            cache: false,
            success: function (html) {
                if (html.error == false) {
                    $("#me_loader").empty();
                    setVal(config.user_name, name);
                    setVal(config.user_email, email);
                    $("#update_success_text").html("<b>" + html.message + "</b>");
                    $("#update_success").popup("open");
                } else {
                    $("#me_loader").empty();
                    $("#update_success_text").html("<b>" + html.message + "</b>");
                    $("#update_success").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#me_loader").empty();
                $("#update_success_text").html("<b>Process failed please try again after some times.....</b>");
                $("#update_success").popup("open");
            }
        });
    }
}


/****** Share page functions  ***/

function gplusShare() {
    var url = "http://youtu.be/U-AAL_3r9Vg";
    var fullurl = "https://plus.google.com/share?url=" + url;
    window.open(fullurl, '_system');
    return false;
}

function fbShare() {
    var url = "http://youtu.be/GB_JRRm8hAQ";
    var fullurl = "http://www.facebook.com/sharer/sharer.php?u=" + url;
    window.open(fullurl, '_system');
    return false;
}

function twitterShare() {
    var url = "http://youtu.be/GB_JRRm8hAQ";
    var ttl = "Dedicated mobile app about E-Gas Cylinder. Download now for free!";
    var fullurl = "https://twitter.com/share?original_referer=http://www.charing.com/&source=tweetbutton&text=" + ttl + "&url=" + url;
    window.open(fullurl, '_system');
    return false;
}

function rateUs() {
    var fullurl = "http://youtu.be/GB_JRRm8hAQ";
    window.open(fullurl, '_system');
    return false;
}


/****** Feedback page functions  ***/

function showFeedbackForm() {
    var name = getVal(config.user_name);
    var email = getVal(config.user_email);
    var mobile = getVal(config.user_mobile);
    if (name != null && email != null && mobile != null) {
        $("#contact_submit").addClass("remove_form");
    } else {
        $("#contact_submit").removeClass("remove_form");
    }
}

function validForm() {
    if ($.trim($("#contact_name").val()).length < 3) {
        $("#feedback_err_text").html("<b>Name must be 3 char</b>");
        $("#feedback_err").popup("open");
        $("#contact_name").focus();
        return false;
    }
    if (!validateEmail($.trim(jQuery("#contact_email").val()))) {
        $("#feedback_err_text").html("<b>Please enter valid email</b>");
        $("#feedback_err").popup("open");
        $("#contact_email").focus();
        return false;
    }
    if ($.trim($("#contact_message").val()).length < 20) {
        $("#feedback_err_text").html("<b>Message at least 20 char</b>");
        $("#feedback_err").popup("open");
        $("#contact_message").focus();
        return false;
    }
    return true;
}

function receiveForm() {
    var message = $.trim($("#contact_message").val());
    var data = {};
    var name = getVal(config.user_name);
    var email = getVal(config.user_email);
    var mobile = getVal(config.user_mobile);
    if (message != "") {
        if (name != null && email != null && mobile != null) {
            data = {
                name: name,
                email: email,
                phone: mobile,
                message: message
            };
        } else {
            if (validForm()) {
                name = $("#contact_name").val();
                email = $("#contact_email").val();
                mobile = $("#contact_num").val();
                data = {
                    name: name,
                    email: email,
                    phone: mobile,
                    message: message
                };
            }
        }
        $.ajax({
            type: "POST",
            url: config.api_url + "module=user&action=feedback",
            data: data,
            cache: false,
            success: function (data) {
                if (data.error == false) {
                    $("#feedback_err_text").html("<b>" + data.message + "</b>");
                    $("#feedback_err").popup("open");
                } else {
                    $("#feedback_err_text").html("<b>" + data.message + "</b>");
                    $("#feedback_err").popup("open");
                }
            }
        });
    } else {
        $("#feedback_err_text").html("<b>Please enter feedback</b>");
        $("#feedback_err").popup("open");
    }
    return false;
}


/****** Menu Pannel functions  ***/

function openJayam() {
    window.open('http://www.jayam.co.uk', '_system');
    return false;
}


/****** FAQ page functions  ***/

function showFAQ() {
    $("#faq_details").empty();
    var rs = $.parseJSON(getVal(config.app_config));
    $("#faq_details").append(rs["faq_details"]);
}


/****** Contact page functions  ***/

function showContact() {
    $("#contact_details").empty();
    var rs = $.parseJSON(getVal(config.app_config));
    var direction = '<a href="#" class="ui-btn" onclick="getDirection()">Get Directions</a>'
    $("#contact_details").append(rs["contact_details"] + direction);
}

function getDirection() {
    window.open('https://www.google.co.in/maps/dir//Thiru+Enterprises,+No.+73%2F95,+Kutty+Gramini+Street,+Kamaraj+Nagar,+Raja+Annamalai+Puram,+Chennai,+Tamil+Nadu+600028/@13.020363,80.262495,17z/data=!4m13!1m4!3m3!1s0x3a5267c46139fa95:0x98a4165dd0cd40e6!2sThiru+Enterprises,+No.+73%2F95!3b1!4m7!1m0!1m5!1m1!1s0x3a5267c46139fa95:0x98a4165dd0cd40e6!2m2!1d80.262495!2d13.020363?hl=en96324', '_system');
    return false;
}


/****** Policy page functions  ***/

function showPolicy() {
    $("#policy_details").empty();
    var rs = $.parseJSON(getVal(config.app_config));
    $("#policy_details").append(rs["policy_details"]);
}


/****** About app page functions  ***/

function showAboutApp() {
    $("#about_app_details").empty();
    var rs = $.parseJSON(getVal(config.app_config));
    $("#about_app_details").append(rs["about_app_details"]);
}


/****** Refer page functions  ***/

function referFriend() {
    var email = $("#friend_email").val();
    var msg = $.trim($("#friend_message").val());
    var data = {
        name: getVal(config.user_name),
        mobile: getVal(config.user_mobile),
        email: email,
        message: msg
    };
    if (!validateEmail($.trim(email))) {
        $("#refer_err_text").html("<b>Please enter valid email address</b>");
        $("#refer_err").popup("open");
    } else {
        if (msg != "") {
            $.ajax({
                type: "POST",
                url: config.api_url + "module=user&action=invitefriend",
                data: data,
                cache: false,
                success: function (data) {
                    if (data.error == false) {
                        $("#refer_err_text").html("<b>" + data.message + "</b>");
                        $("#refer_err").popup("open");
                    } else {
                        $("#refer_err_text").html("<b>" + data.message + "</b>");
                        $("#refer_err").popup("open");
                    }
                }
            });
        } else {
            $("#refer_err_text").html("<b>Please enter message</b>");
            $("#refer_err").popup("open");
        }
    }
}
