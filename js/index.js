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
        "#loading": {handler: "loadingPage", events: "bs"},
        "#register_one": {handler: "registerStepOnePage", events: "bs"},
        "#verify": {handler: "verifyPage", events: "bs"},
        "#supplier": {handler: "supplierPage", events: "bs"},
        "#collection": {handler: "collectionPage", events: "bs"}
    }],
        {
            loadingPage: function (type, match, ui) {
                log("Loading Page", 3);
                loadLocalData();
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
            supplierPage: function (type, match, ui) {
                log("Supplier Page", 3);
                loadCustomerPriceDetails();
            },
            collectionPage: function (type, match, ui) {
                log("Collection Page", 3);
                loadCustomerPaymentDetails();
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
var customer_price_details = [];
var customer_payment_details = [];
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


/**********   Loading Page functions ***/

function loadLocalData() {
    $("#load_gif").append(loading);
    $("#load_data").append("Loading app configuration");
    $.ajax({
        type: "GET",
        url: config.api_url + "module=config&action=list",
        cache: false,
        success: function (rs) {
            if (rs.error == false) {
                setVal(config.app_config, JSON.stringify(rs.data));
                if (getVal(config.user_id) != null && getVal(config.user_status) != 0 && getVal(config.employee_role) == 3) {
                    $(":mobile-pagecontainer").pagecontainer("change", "#sales");
                } else if (getVal(config.user_id) != null && getVal(config.user_status) != 0 && getVal(config.employee_role) == 4) {
                    $(":mobile-pagecontainer").pagecontainer("change", "#sales");
                } else {
                    $(":mobile-pagecontainer").pagecontainer("change", "#register_one");
                }
            }

        }
    });
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
            url: config.api_url + "module=admin&action=already_exist",
            data: data,
            cache: false,
            success: function (rs) {
                $("#reg_one_spinner").empty();
                if (rs.error == false) {
                    $("#reg_err_one .ui-content a").attr("href", "#verify");
                    $("#reg_err_one .ui-content a").removeAttr("data-rel");
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
                    setVal(config.employee_role, rs.employee_role);
                    $("#reg_err_one_text").html("<b>" + rs.message + "</b>");
                    $("#reg_err_one").popup("open");
                } else {
                    $("#reg_err_one .ui-content a").removeAttr("href");
                    $("#reg_err_one .ui-content a").attr("data-rel", "back");
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
            code: code,
            device_token: getVal(config.device_token)
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=verify",
            data: details,
            cache: false,
            success: function (html) {
                if (html.error == false) {
                    $("#verify_err .ui-content a").removeAttr("data-rel");
                    $("#verify_err .ui-content a").attr("onclick", "redirectResponseiveEmployee()");
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

function redirectResponseiveEmployee() {
    if (getVal(config.user_id) != null && getVal(config.user_status) != 0 && getVal(config.employee_role) == 3) {
        $(":mobile-pagecontainer").pagecontainer("change", "#supplier");
    } else if (getVal(config.user_id) != null && getVal(config.user_status) != 0 && getVal(config.employee_role) == 4) {
        $(":mobile-pagecontainer").pagecontainer("change", "#collection");
    } else {
        $(":mobile-pagecontainer").pagecontainer("change", "#register_one");
    }
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
    $.ajax({
        type: "POST",
        url: config.api_url + "module=admin&action=resend",
        data: details,
        cache: false,
        success: function (html) {
            if (html.error == false) {
                startTimer();
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


/**********   Supplier Page functions ***/

function loadCustomerPriceDetails() {
    $("#supplier_spinner").append(loading);
    $("#customer_list_supplier").empty();
    $("#cyl_price").val("");
    $("#full_cyl").val("");
    $("#empty_cyl").val("");
    $("#cost").val("");
    var options = "<option value=''>--Select customer name--</option>"
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=supply_customer_list",
        dataType: "json",
        cache: false,
        success: function (rs) {
            if (rs.error == false) {
                $.each(rs.data, function (cusindex, cusrow) {
                    options = options + "<option value='" + cusrow.customer_id + "'>" + cusrow.customer_name + "</option>";
                    customer_price_details.push({name: cusrow.customer_name, id: cusrow.customer_id, items: []});
                    $.each(customer_price_details, function (index, row) {
                        if (cusrow.customer_id == row.id) {
                            $.each(cusrow.items, function (itemindex, itemrow) {
                                row.items.push({id: itemrow.item_id, price: itemrow.item_price, tax: itemrow.tax});
                            });
                            return false;
                        }
                    });
                });
                $("#customer_list_supplier").append(options);
                $("#supplier_spinner").empty();
            }
        },
        error: function (request, status, error) {
            $("#supplier_spinner").empty();
            $("#supplier_popup .ui-content a").removeAttr("href");
            $("#supplier_popup .ui-content a").attr("data-rel", "back");
            $("#supplier_popup_text").html("Loading faild please try after sometimes later...");
            $("#supplier_popup").popup("open");
        }
    });
}

function setPrice() {
    $("#supplier_spinner").empty();
    var tax = "";
    var grand_total = "";
    var tax_amt = "";
    var price = "";
    var qty = 1;
    var val = $("#customer_list_supplier").val();
    $.each(customer_price_details, function (index, row) {
        if (row.id == val) {
            $.each(row.items, function (itemind, itemrow) {
                if (itemrow.id == 3) {
                    price = itemrow.price;
                    $("#cyl_price").val(itemrow.price);
                    tax = itemrow.tax;
                    return false;
                }
            });
            return false;
        }
    });
    tax_amt = price * qty * tax / 100;
    grand_total = tax_amt + price * qty;
    $("#full_cyl").val(1);
    $("#empty_cyl").val(0);
    $("#cost").val(grand_total);
}

function calcTotal() {
    var tax = "";
    $("#supplier_spinner").empty();
    var cyls = $("#full_cyl").val();
    var price = $("#cyl_price").val();
    var id = $("#customer_list_supplier").val();
    $.each(customer_price_details, function (index, row) {
        if (row.id == id) {
            $.each(row.items, function (itemindex, itemrow) {
                if (itemrow.id == 3) {
                    tax = itemrow.tax;
                    return false;
                }
            });
            return false;
        }
    });
    var tax_amt = cyls * price * tax / 100;
    var grand_total = cyls * price + tax_amt;
    $("#cost").val(grand_total);
}

function sendSupplyDetails() {
    var customer = $("#customer_list_supplier").val();
    if (customer != "") {
        $("#supplier_spinner").append(loading);
        var tax = "";
        $.each(customer_price_details, function (cusindex, cusrow) {
            if (cusrow.id == customer) {
                $.each(cusrow.items, function (itemindex, itemrow) {
                    if (itemrow.id == 3) {
                        tax = itemrow.tax;
                        return false;
                    }
                });
            }
            return false;
        });
        var data = {
            employee_id: getVal(config.user_id),
            customer_id: customer,
            items: [{item_id: 3, quantity: $("#full_cyl").val(), tax: tax, received_cylinder: $("#empty_cyl").val()}],
            supply_amount: $("#cost").val()
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=delivery",
            data: data,
            cache: false,
            success: function (data) {
                $("#supplier_spinner").empty();
                if (data.error == false) {
                    $("#supplier_popup .ui-content a").removeAttr("href");
                    $("#supplier_popup .ui-content a").attr("data-rel", "back");
                    $("#supplier_popup_text").html(data.message);
                    $("#supplier_popup").popup("open");
                } else {
                    $("#supplier_popup .ui-content a").removeAttr("href");
                    $("#supplier_popup .ui-content a").attr("data-rel", "back");
                    $("#supplier_popup_text").html(data.message);
                    $("#supplier_popup").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#supplier_spinner").empty();
                $("#supplier_popup .ui-content a").removeAttr("href");
                $("#supplier_popup .ui-content a").attr("data-rel", "back");
                $("#supplier_popup_text").html("Loading faild please try after sometimes later...");
                $("#supplier_popup").popup("open");
            }
        });
    } else {
        $("#supplier_spinner").empty();
        $("#supplier_popup .ui-content a").removeAttr("href");
        $("#supplier_popup .ui-content a").attr("data-rel", "back");
        $("#supplier_popup_text").html("Please select the customer name");
        $("#supplier_popup").popup("open");
    }
}


/**********   Sales Details Page functions ***/

function showSalesDetails() {
    var data = {
        id: config.user_id
    };
    $.ajax({
        type: "POST",
        url: config.api_url + "module=admin&action=sales_details",
        data: data,
        cache: false,
        success: function (data) {
            if (data.error == false) {

            } else {

            }
        },
        error: function (request, status, error) {

        }
    });
}


/**********   Collection Page functions ***/

function loadCustomerPaymentDetails() {
    $("#collection_spinner").append(loading);
    $("#customer_list_collection").empty();
    $("#empty_cyls").val("");
    $("#prev_bal").val("");
    $("#curr_bal").val("");
    $("#received_pay").val("");
    $("#total_bal").val("");
    var options = "<option value=''>--Select customer name--</option>"
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=collection_customer_list",
        dataType: "json",
        cache: false,
        success: function (rs) {
            if (rs.error == false) {
                $.each(rs.data, function (cusindex, cusrow) {
                    options = options + "<option value='" + cusrow.id + "'>" + cusrow.name + "</option>";
                    customer_payment_details.push({id: cusrow.id, name: cusrow.name, balance: [{pending_cyls: cusrow.balance.pending_cylinder, pending_amt: cusrow.balance.pending_amount}]});
                });
                $("#customer_list_collection").append(options);
                $("#collection_spinner").empty();
            }
        },
        error: function (request, status, error) {
            $("#collection_spinner").empty();
            $("#collection_popup .ui-content a").removeAttr("href");
            $("#collection_popup .ui-content a").attr("data-rel", "back");
            $("#collection_popup_text").html("Loading faild please try after sometimes later...");
            $("#collection_popup").popup("open");
        }
    });
}

function setTransactions() {
    $("#collection_spinner").empty();
    var id = $("#customer_list_collection").val();
    if (id != "") {
        $.each(customer_payment_details, function (index, row) {
            if (row.id == id) {
                $.each(row.balance, function (pendingind, pendingrow) {
                    $("#empty_cyls").val(pendingrow.pending_cyls);
                    $("#prev_bal").val(pendingrow.pending_amt);
                });
                return false;
            }
        });
    }
}

function calcBalance() {
    $("#collection_spinner").empty();
    var balance = $("#prev_bal").val();
    var received = $("#received_pay").val();
    $("#total_bal").val(balance - received);
}

function sendCollectionDetails() {
    var customer = $("#customer_list_collection").val();
    if (customer != "") {
        $("#collection_spinner").append(loading);
        var data = {
            employee_id: getVal(config.user_id),
            id: customer,
            amount: $("#received_pay").val()
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=collection_completed",
            data: data,
            cache: false,
            success: function (data) {
                $("#collection_spinner").empty();
                if (data.error == false) {
                    $("#collection_popup .ui-content a").removeAttr("href");
                    $("#collection_popup .ui-content a").attr("data-rel", "back");
                    $("#collection_popup_text").html(data.message);
                    $("#collection_popup").popup("open");
                } else {
                    $("#collection_popup .ui-content a").removeAttr("href");
                    $("#collection_popup .ui-content a").attr("data-rel", "back");
                    $("#collection_popup_text").html(data.message);
                    $("#collection_popup").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#collection_spinner").empty();
                $("#collection_popup .ui-content a").removeAttr("href");
                $("#collection_popup .ui-content a").attr("data-rel", "back");
                $("#collection_popup_text").html("Loading faild please try after sometimes later...");
                $("#collection_popup").popup("open");
            }
        });
    } else {
        $("#collection_spinner").empty();
        $("#collection_popup .ui-content a").removeAttr("href");
        $("#collection_popup .ui-content a").attr("data-rel", "back");
        $("#collection_popup_text").html("Please select the customer name");
        $("#collection_popup").popup("open");
    }
}


/**********   Expense Page functions ***/

function recordExpense() {
    var reason = $("#expense_type").val();
    var amt = $("#expense_amt").val();
    $("#expense_spinner").empty();
    $("#expense_spinner").append(loading);
    var data = {
        employee_id: getVal(config.user_id),
        reason: reason,
        amount: amt
    };
    if (amt != "") {
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=post_expenses",
            data: data,
            cache: false,
            success: function (data) {
                $("#expense_spinner").empty();
                if (data.error == false) {
                    $("#expense_popup .ui-content a").removeAttr("href");
                    $("#expense_popup .ui-content a").attr("data-rel", "back");
                    $("#expense_popup_text").html(data.message);
                    $("#expense_popup").popup("open");
                } else {
                    $("#expense_popup .ui-content a").removeAttr("href");
                    $("#expense_popup .ui-content a").attr("data-rel", "back");
                    $("#expense_popup_text").html(data.message);
                    $("#expense_popup").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#expense_spinner").empty();
                $("#expense_popup .ui-content a").removeAttr("href");
                $("#expense_popup .ui-content a").attr("data-rel", "back");
                $("#expense_popup_text").html("Loading faild please try after sometimes later...");
                $("#expense_popup").popup("open");
            }
        });
    }
}