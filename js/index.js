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
        "#stock": {handler: "stockPage", events: "bs"},
        "#supplier": {handler: "supplierPage", events: "bs"},
        "#list_expenses": {handler: "listexpensesPage", events: "bs"},
        "#purchase": {handler: "purchasePage", events: "bs"},
        "#purchase_list": {handler: "purchaseListPage", events: "bs"},
        "#view_purchased_item": {handler: "viewpurchaseditemPage", events: "bs"},
        "#expense_detail": {handler: "expensedetailPage", events: "bs"},
        "#expense": {handler: "expensePage", events: "bs"},
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
            stockPage: function (type, match, ui) {
                log("Stock Page", 3);
                loadStockDetails();
            },
            supplierPage: function (type, match, ui) {
                log("Supplier Page", 3);
                calcTotal();
                loadCustomerPriceDetails();
            },
            listexpensesPage: function (type, match, ui) {
                log("List Expenses Page", 3);
                listExpenses();
            },
            expensePage: function (type, match, ui) {
                log("Expenses Page", 3);
                showExpenseDate();
            },
            expensedetailPage: function (type, match, ui) {
                log("Expense Detail Page", 3);
                var params = router.getParams(match[1]);
                showExpenseDetail(params.id);
            },
            viewpurchaseditemPage: function (type, match, ui) {
                log("View Ordered Items Page", 3);
                var params = router.getParams(match[1]);
                loadPurchasedItem(params.id);
                calcUpdateTotal(params.id);
            },
            purchaseListPage: function (type, match, ui) {
                log("Purchase List Page", 3);
                showPurchaseList();
            },
            purchasePage: function (type, match, ui) {
                log("Purchase Page", 3);
                resetPurchase();
                showSupplierList();
            },
            collectionPage: function (type, match, ui) {
                log("Collection Page", 3);
                calcBalance();
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
var supplier_details = [];
var purchased_items = [];
var expenses_list = [];
var panel_open = false;
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

function openPanel() {
    if (panel_open != true) {
        $("#mypanel").panel();
        $("#mypanel").panel("open");
        panel_open = true;
    } else {
        $("#mypanel").panel();
        $("#mypanel").panel("close");
        panel_open = false;
    }
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
                if (getVal(config.user_id) != null && getVal(config.user_status) != 0) {
                    $(":mobile-pagecontainer").pagecontainer("change", "#supplier");
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
        $("#register_one .ui-content a").addClass("remove-item");
        var mobile = $.trim($('#mobile').val());
        var data = {mobile: mobile};
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=already_exist",
            data: data,
            cache: false,
            success: function (rs) {
                $("#reg_one_spinner").empty();
                $("#register_one .ui-content a").removeClass("remove-item");
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
                    $("#register_one .ui-content a").removeClass("remove-item");
                    $("#reg_err_one .ui-content a").removeAttr("href");
                    $("#reg_err_one .ui-content a").attr("data-rel", "back");
                    $("#reg_err_one_text").html("<b>" + rs.message + "</b>");
                    $("#reg_err_one").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#register_one .ui-content a").removeClass("remove-item");
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
    $("#verify_spinner").empty();
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
    $("#verify_spinner").empty();
    $("#verify_spinner").append(loading);
    $("#verify .ui-content a").addClass("remove-item");
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
                $("#verify_spinner").empty();
                $("#verify .ui-content a").removeClass("remove-item");
                if (html.error == false) {
                    $("#verify_err .ui-content a").removeAttr("data-rel");
                    $("#verify_err .ui-content a").attr("onclick", "redirectSupplier()");
                    setVal(config.user_status, html.status);
                    $("#verify_err_text").html("<b>" + html.message + "</b>");
                    $("#verify_err").popup("open");
                } else {
                    $("#verify_err_text").html("<b>" + html.message + "</b>");
                    $("#verify_err").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#verify .ui-content a").removeClass("remove-item");
                $("#verify_spinner").empty();
                $("#err_msg").empty();
                $("#err_msg").append("Process fail please try again......");
            }
        });
    }
}

function redirectSupplier() {
    if (getVal(config.user_id) != null && getVal(config.user_status) != 0) {
        $(":mobile-pagecontainer").pagecontainer("change", "#supplier");
    } else {
        $(":mobile-pagecontainer").pagecontainer("change", "#register_one");
    }
}

function resend() {
    $("#verify .ui-content a").addClass("remove-item");
    $("#verify_spinner").append(loading);
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
            $("#verify_spinner").empty();
            $("#verify .ui-content a").removeClass("remove-item");
            if (html.error == false) {
                startTimer();
                $("#verify_err_text").html("<b>" + html.message + "</b>");
                $("#verify_err").popup("open");
            }
        },
        error: function (request, status, error) {
            $("#verify_spinner").empty();
            $("#verify .ui-content a").removeClass("remove-item");
            $("#verify_err_text").html("<b>Process fail please try again......</b>");
            $("#verify_err").popup("open");
        }
    });
}


/**********   Supplier Page functions ***/

function loadCustomerPriceDetails() {
    customer_price_details = [];
    $("#supplier .ui-content table").addClass("remove-item");
    $("#supplier_spinner").append(loading);
    $("#customer_list_supplier").empty();
    $("#cyl_price").val(0);
    $("#full_cyl").val("");
    $("#empty_cyl").val("");
    $("#cost").html(0);
    var options = "<option value=''>--Select customer name--</option>"
    var date = "";
    var date_options = "";
    var one_day = (60 * 60 * 24 * 1000);
    $("#supply_date").empty();
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=supply_customer_list",
        dataType: "json",
        cache: false,
        success: function (rs) {
            $("#supplier .ui-content table").removeClass("remove-item");
            if (rs.error == false) {
                var from = rs.date.split("-");
                date = new Date(from[2], from[1] - 1, from[0]);
                date_options = "<option value='" + $.format.date(date, "dd-MM-yyyy") + "'>" + $.format.date(date, "dd-MM-yyyy") + "</option>"
                for (var i = 1; i <= 30; i++) {
                    date_options = date_options + "<option value='" + $.format.date(date - one_day, "dd-MM-yyyy") + "'>" + $.format.date(date - one_day, "dd-MM-yyyy") + "</option>";
                    date = date - one_day;
                }
                $.each(rs.data, function (cusindex, cusrow) {
                    options = options + "<option value='" + cusrow.customer_id + "'>" + cusrow.customer_name + "</option>";
                    customer_price_details.push({name: cusrow.customer_name, id: cusrow.customer_id, empties: cusrow.pending_cylinder, items: []});
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
                $("#supply_date").append(date_options);
                $("#supplier_spinner").empty();
            } else {
                $("#customer_list_supplier").append("<option value=''>-- No customers --</option>");
                $("#supplier_spinner").empty();
            }
        },
        error: function (request, status, error) {
            $("#supplier .ui-content table").removeClass("remove-item");
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
    var qty = 0;
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
        }
    });
    tax_amt = price * qty * tax / 100;
    grand_total = tax_amt + price * qty;
    $("#full_cyl").val(0);
    $("#empty_cyl").val(0);
    $("#cost").html(grand_total);
}

function calcTotal() {
    var tax = "";
    $("#supplier_spinner").empty();
    $("#full_cyl").keyup(function (e) {
        var cyls = $(this).val();
        var price = $("#cyl_price").val();
        if (cyls != 0) {
            var id = $("#customer_list_supplier").val();
            $.each(customer_price_details, function (index, row) {
                if (row.id == id) {
                    $.each(row.items, function (itemindex, itemrow) {
                        if (itemrow.id == 3) {
                            tax = itemrow.tax;
                            return false;
                        }
                    });
                }
            });
            var tax_amt = cyls * price * tax / 100;
            var grand_total = cyls * price + tax_amt;
            $("#cost").html(grand_total);
        } else {
            $("#cost").html(0);
        }
    });
    $("#cyl_price").keyup(function (e) {
        var price = $(this).val();
        var cyls = $("#full_cyl").val();
        if (price != 0) {
            var id = $("#customer_list_supplier").val();
            $.each(customer_price_details, function (index, row) {
                if (row.id == id) {
                    $.each(row.items, function (itemindex, itemrow) {
                        if (itemrow.id == 3) {
                            tax = itemrow.tax;
                            return false;
                        }
                    });
                }
            });
            var tax_amt = cyls * price * tax / 100;
            var grand_total = cyls * price + tax_amt;
            $("#cost").html(grand_total);
        } else {
            $("#cost").html(0);
        }
    });
}

function sendSupplyDetails() {
    var customer = $("#customer_list_supplier").val();
    var tax = 0;
    var empties = 0;
    var received_empty = parseInt($("#empty_cyl").val());
    var supplied_full = parseInt($("#full_cyl").val());
    var date = $("#supply_date").val();
    $.each(customer_price_details, function (cusindex, cusrow) {
        if (cusrow.id == customer) {
            empties = cusrow.empties;
            $.each(cusrow.items, function (itemindex, itemrow) {
                if (itemrow.id == 3) {
                    tax = itemrow.tax;
                    return false;
                }
            });
        }
    });
    if (customer != "" && $("#full_cyl").val() > 0) {
        if (received_empty <= (empties + supplied_full)) {
            $("#supplier .ui-content a").addClass("remove-item");
            $("#supplier_spinner").append(loading);
            var data = {
                employee_id: getVal(config.user_id),
                customer_id: customer,
                items: [{item_id: 3, quantity: $("#full_cyl").val(), tax: tax, received_cylinder: $("#empty_cyl").val(), rate: $("#cyl_price").val()}],
                supply_amount: $("#cost").html(),
                date: date
            };
            $.ajax({
                type: "POST",
                url: config.api_url + "module=admin&action=delivery",
                data: data,
                cache: false,
                success: function (data) {
                    $("#supplier .ui-content a").removeClass("remove-item");
                    $("#supplier_spinner").empty();
                    if (data.error == false) {
                        $("#supplier_popup .ui-content a").removeAttr("href");
                        $("#supplier_popup .ui-content a").attr("data-rel", "back");
                        $("#supplier_popup_text").html(data.message);
                        $("#supplier_popup").popup("open");
                        loadCustomerPriceDetails();
                    } else {
                        $("#supplier_popup .ui-content a").removeAttr("href");
                        $("#supplier_popup .ui-content a").attr("data-rel", "back");
                        $("#supplier_popup_text").html(data.message);
                        $("#supplier_popup").popup("open");
                        loadCustomerPriceDetails();
                    }
                },
                error: function (request, status, error) {
                    $("#supplier .ui-content a").removeClass("remove-item");
                    $("#supplier_spinner").empty();
                    $("#supplier_popup .ui-content a").removeAttr("href");
                    $("#supplier_popup .ui-content a").attr("data-rel", "back");
                    $("#supplier_popup_text").html("Loading faild please try after sometimes later...");
                    $("#supplier_popup").popup("open");
                }
            });
        } else {
            $("#supplier_popup .ui-content a").removeAttr("href");
            $("#supplier_popup .ui-content a").attr("data-rel", "back");
            $("#supplier_popup_text").html("Please confirm received empty cylinders");
            $("#supplier_popup").popup("open");
        }
    } else if (customer != "" && ($("#full_cyl").val() == "" || $("#full_cyl").val() <= 0) && $("#empty_cyl").val() != "") {
        if (received_empty <= empties) {
            $("#supplier .ui-content a").addClass("remove-item");
            $("#supplier_spinner").append(loading);
            var data = {
                employee_id: getVal(config.user_id),
                customer_id: customer,
                empty_cylinder: $("#empty_cyl").val(),
                item_id: 3,
                date: date
            };
            $.ajax({
                type: "POST",
                url: config.api_url + "module=admin&action=collection_empties",
                data: data,
                cache: false,
                success: function (data) {
                    $("#supplier .ui-content a").removeClass("remove-item");
                    $("#supplier_spinner").empty();
                    if (data.error == false) {
                        $("#supplier_popup .ui-content a").removeAttr("href");
                        $("#supplier_popup .ui-content a").attr("data-rel", "back");
                        $("#supplier_popup_text").html(data.message);
                        $("#supplier_popup").popup("open");
                        loadCustomerPriceDetails();
                    } else {
                        $("#supplier_popup .ui-content a").removeAttr("href");
                        $("#supplier_popup .ui-content a").attr("data-rel", "back");
                        $("#supplier_popup_text").html(data.message);
                        $("#supplier_popup").popup("open");
                        loadCustomerPriceDetails();
                    }
                },
                error: function (request, status, error) {
                    $("#supplier .ui-content a").removeClass("remove-item");
                    $("#supplier_spinner").empty();
                    $("#supplier_popup .ui-content a").removeAttr("href");
                    $("#supplier_popup .ui-content a").attr("data-rel", "back");
                    $("#supplier_popup_text").html("Loading faild please try after sometimes later...");
                    $("#supplier_popup").popup("open");
                }
            });
        } else {
            $("#supplier_popup .ui-content a").removeAttr("href");
            $("#supplier_popup .ui-content a").attr("data-rel", "back");
            $("#supplier_popup_text").html("Please confirm received empty cylinders");
            $("#supplier_popup").popup("open");
        }
    } else {
        $("#supplier_spinner").empty();
        $("#supplier_popup .ui-content a").removeAttr("href");
        $("#supplier_popup .ui-content a").attr("data-rel", "back");
        $("#supplier_popup_text").html("Please select the customer name");
        $("#supplier_popup").popup("open");
    }
}


/**********   Stock Page functions ***/

function loadStockDetails() {
    $("#stock_details").empty();
    $("#stock_details").append(loading);
    var out = "";
    var full_cyl_table = '<table><thead><tr><th class="align-left">Full cylinder</th><th class="align-left">Month</th><th class="align-left">Daily</th></tr></thead><tbody>';
    var mt_cyl_table = '<table><thead><tr><th class="align-left">Empty cylinder</th><th class="align-left">Month</th><th class="align-left">Daily</th></tr></thead><tbody>';
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=stock_list",
        dataType: 'json',
        cache: false,
        success: function (data) {
            if (data.error == false) {
                $("#stock_details").empty();
                out = out + '<p>' + data.data.name + '</p>';
                out = out + full_cyl_table + '<tr><td class="align-left">Opening</td><td class="align-center">' + data.data.monthly.full_cylinder_monthly_open_stock + '</td><td class="align-center">' + data.data.daily.full_cylinder_daily_open_stock + '</td></tr>';
                out = out + '<tr><td class="align-left">Purchase</td><td class="align-center">' + data.data.monthly.full_cylinder_current_month_purchase + '</td><td class="align-center">' + data.data.daily.full_cylinder_daily_purchase + '</td></tr>';
                out = out + '<tr><td class="align-left">Sales</td><td class="align-center">' + data.data.monthly.full_cylinder_current_month_sales + '</td><td class="align-center">' + data.data.daily.full_cylinder_daily_sales + '</td></tr>';
                out = out + '<tr><td class="align-left">Balance</td><td class="align-center">' + data.data.monthly.full_cylinder_today_balance + '</td><td class="align-center">' + data.data.daily.full_cylinder_today_balance + '</td></tr>';
                out = out + '</tbody></table>';
                out = out + mt_cyl_table + '<tr><td class="align-left">Opening</td><td class="align-center">' + data.data.monthly.empty_cylinder_monthly_open_stock + '</td><td class="align-center">' + data.data.daily.empty_cylinder_daily_open_stock + '</td></tr>';
                out = out + '<tr><td class="align-left">Received</td><td class="align-center">' + data.data.monthly.empty_cylinder_curr_month_received + '</td><td class="align-center">' + data.data.daily.empty_cylinder_daily_received + '</td></tr>';
                out = out + '<tr><td class="align-left">Sent</td><td class="align-center">' + data.data.monthly.empty_cylinder_curr_month_sent + '</td><td class="align-center">' + data.data.daily.empty_cylinder_daily_sent + '</td></tr>';
                out = out + '<tr><td class="align-left">Balance</td><td class="align-center">' + data.data.monthly.empty_cylinder_today_balance + '</td><td class="align-center">' + data.data.daily.empty_cylinder_today_balance + '</td></tr>';
                out = out + '</tbody></table>';
                $(out).appendTo("#stock_details").enhanceWithin();
            } else {
                $("#stock_details").empty();
                $("#stock_details").append(data.message);
            }
        },
        error: function (request, status, error) {
            $("#stock_details").empty();
            $("#stock_details").append("Process failed please try again......");
        }
    });
}


/**********   Purchase List Page functions ***/

function showPurchaseList() {
    purchased_items = [];
    $("#purchase_list_items").empty();
    $("#purchase_list_items").append(loading);
    var out = '<div><ul data-role="listview" data-inset="true" data-theme="a">';
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=purchase_list",
        dataType: "json",
        cache: false,
        success: function (data) {
            if (data.error == false) {
                $("#purchase_list_items").empty();
                $.each(data.data, function (index, row) {
                    purchased_items.push({id: row.id, supplier_name: row.supplier_name, price: row.price, qty: row.quantity, date: row.date, total: row.total_amount, item_name: row.item_name, cheque: row.chq_no});
                    out = out + '<li><a class="ui-btn ui-btn-corner-all" href="#view_purchased_item?id=' + row.id + '">#' + row.id + '. on ' + $.format.date(row.date, "dd-MMM-yy") + ' value of &#8377; ' + parseInt(row.total_amount) + '</a></li>';
                });
                out = out + '</ul></div>';
                $(out).appendTo("#purchase_list_items").enhanceWithin();
            }
        },
        error: function (request, status, error) {
            $("#purchase_list_items").empty();
            $("#purchase_list_items").append("Loading failed try again!!");
        }
    });
}


/**********   View Purchased Item Page functions ***/

function loadPurchasedItem(id) {
    $("#purchased_item_detail").empty();
    $("#purchased_item_spinner").empty();
    $("#purchased_item_heading").html("Purchased id #" + id);
    var out = "";
    out = out + '<table><tbody>';
    $.each(purchased_items, function (index, row) {
        if (id == row.id) {
            out = out + '<tr><td>Employee Name</td><td>' + row.supplier_name + '</td></tr>';
            out = out + '<tr><td>Net Weight</td><td>' + row.item_name + '</td></tr>';
            out = out + "<tr><td>Date</td><td><select data-role='none' name='purchase_update_date' id='purchase_update_date'></select></td></tr>";
            out = out + '<tr><td>Rate &#8377;</td><td><input type="text" value="' + parseInt(row.price) + '" id="update_price_' + id + '"/> </td></tr>';
            out = out + '<tr><td>Quantity</td><td><input type="text" value="' + row.qty + '" id="update_qty_' + id + '"/> </td></tr>';
            out = out + '<tr><td>Total &#8377;</td><td><span id="update_total_' + id + '">' + parseInt(row.total) + '</span></td></tr>';
            out = out + '<tr><td>Cheque No</td><td><input type="text" value="' + row.cheque + '" id="update_cheque_' + id + '"/> </td></tr>';
            out = out + '<tr><td colspan="2"><a class="ui-btn ui-corner-all" onclick="updatePurchase(' + id + ')">Update Purchase</a></td></tr>';
            return false;
        }
    });
    out = out + '</tbody></table>';
    $(out).appendTo("#purchased_item_detail").enhanceWithin();

    var date = new Date();
    var date_options = "<option value=''>--Select date--</option><option value='" + $.format.date(date, "dd-MM-yyyy") + "'>" + $.format.date(date, "dd-MM-yyyy") + "</option>";
    var one_day = (60 * 60 * 24 * 1000);
    $("#purchase_update_date").empty();
    for (var i = 1; i <= 30; i++) {
        date_options = date_options + "<option value='" + $.format.date(date - one_day, "dd-MM-yyyy") + "'>" + $.format.date(date - one_day, "dd-MM-yyyy") + "</option>";
        date = date - one_day;
    }
    $("#purchase_update_date").append(date_options);
}

function calcUpdateTotal(id) {
    $("#purchased_item_spinner").empty();
    $("#update_qty_" + id).keyup(function (e) {
        var rate = $("#update_price_" + id).val();
        if (rate != 0) {
            var qty = $(this).val();
            $("#update_total_" + id).html(rate * qty);
        }
    });
    $("#update_price_" + id).keyup(function (e) {
        var qty = $("#update_qty_" + id).val();
        if (qty != 0) {
            var rate = $(this).val();
            $("#update_total_" + id).html(rate * qty);
        }
    });
}

function updatePurchase(id) {
    $("#view_purchased_item .ui-content a").addClass("remove-item");
    $("#purchased_item_spinner").empty();
    $("#purchased_item_spinner").append(loading);
    var data = {
        id: id,
        rate: $("#update_price_" + id).val(),
        quantity: $("#update_qty_" + id).val(),
        total_amount: $("#update_total_" + id).html(),
        chq_no: $("#update_cheque_" + id).val(),
        date: $("#purchase_update_date").val()
    };
    $.ajax({
        type: "POST",
        url: config.api_url + "module=admin&action=purchase_update",
        data: data,
        cache: false,
        success: function (data) {
            $("#view_purchased_item .ui-content a").removeClass("remove-item");
            $("#purchased_item_spinner").empty();
            if (data.error == false) {
                $("#view_purchase_popup .ui-content a").attr("href", "#purchase_list");
                $("#view_purchase_popup .ui-content a").removeAttr("data-rel");
                $("#view_purchase_popup_text").html(data.message);
                $("#view_purchase_popup").popup("open");
            } else {
                $("#view_purchase_popup .ui-content a").attr("data-rel", "back");
                $("#view_purchase_popup .ui-content a").removeAttr("href");
                $("#view_purchase_popup_text").html(data.message);
                $("#view_purchase_popup").popup("open");
            }
        },
        error: function (request, status, error) {
            $("#view_purchased_item .ui-content a").removeClass("remove-item");
            $("#view_purchase_popup .ui-content a").attr("data-rel", "back");
            $("#view_purchase_popup .ui-content a").removeAttr("href");
            $("#view_purchase_popup_text").html(data.message);
            $("#view_purchase_popup").popup("open");
        }
    });
}


/**********   Purchase Page functions ***/

function resetPurchase() {
    $("#purchase_spinner").empty();
    $("#cheque_no").val("");
    $("#qty").val(0);
    $("#rate").val(0);
    $("#purchase_total").html("");
    $("#qty").keyup(function (e) {
        var rate = $("#rate").val();
        if (rate != 0) {
            var qty = $(this).val();
            $("#purchase_total").html(rate * qty);
        }
    });
    $("#rate").keyup(function (e) {
        var qty = $("#qty").val();
        if (qty != 0) {
            var rate = $(this).val();
            $("#purchase_total").html(rate * qty);
        }
    });
}

function showSupplierList() {
    supplier_details = [];
    $("#purchase .ui-content table").addClass("remove-item");
    $("#employee_list").empty();
    $("#purchase_spinner").empty();
    $("#purchase_spinner").append(loading);
    var options = "<option value=''>--Select Supplier--</option>";
    $("#purchase_date").empty();
    var date = "";
    var date_options = "";
    var one_day = (60 * 60 * 24 * 1000);
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=supplier_list",
        dataType: "json",
        cache: false,
        success: function (data) {
            $("#purchase .ui-content table").removeClass("remove-item");
            $("#purchase_spinner").empty();
            if (data.error == false) {
                var from = data.date.split("-");
                date = new Date(from[2], from[1] - 1, from[0]);
                date_options = "<option value='" + $.format.date(date, "dd-MM-yyyy") + "'>" + $.format.date(date, "dd-MM-yyyy") + "</option>";
                for (var i = 1; i <= 30; i++) {
                    date_options = date_options + "<option value='" + $.format.date(date - one_day, "dd-MM-yyyy") + "'>" + $.format.date(date - one_day, "dd-MM-yyyy") + "</option>";
                    date = date - one_day;
                }
                $.each(data.data, function (index, row) {
                    supplier_details.push({id: row.id, name: row.name, code: row.supplier_no, price: row.price});
                    options = options + "<option value='" + row.id + "'>" + row.name + "</option>";
                });
                $("#employee_list").append(options);
                $("#purchase_date").append(date_options);
            }
        },
        error: function (request, status, error) {
            $("#purchase .ui-content table").removeClass("remove-item");
            $("#purchase_spinner").empty();
            $("#purchase_popup .ui-content a").removeAttr("href");
            $("#purchase_popup .ui-content a").attr("data-rel", "back");
            $("#purchase_popup_text").html("Loading supplier list faild. Please retry!!");
            $("#purchase_popup").popup("open");
        }
    });
}

function getSupplierCode() {
    $("#purchase_spinner").empty();
    var id = $("#employee_list").val()
    if (id != "") {
        $.each(supplier_details, function (index, row) {
            if (id == row.id) {
                $("#emp_code").html(row.code);
                $("#rate").val(parseInt(row.price));
                return false;
            }
        });
    }
}

function validatePurchase() {
    $("#purchase_spinner").empty();
    $("#purchase_popup .ui-content a").removeAttr("href");
    $("#purchase_popup .ui-content a").attr("data-rel", "back");
    var supplier_id = $("#employee_list").val();
    var rate = $("#rate").val();
    var qty = $("#qty").val();
    var cheque = $("#cheque_no").val();
    if (supplier_id == "") {
        $("#purchase_popup_text").html("Select a supplier");
        $("#purchase_popup").popup("open");
        return false;
    }
    if (rate <= 0) {
        $("#purchase_popup_text").html("Amount is invalid");
        $("#purchase_popup").popup("open");
        return false;
    }
    if (qty <= 0) {
        $("#purchase_popup_text").html("Quantity is invalid");
        $("#purchase_popup").popup("open");
        return false;
    }
    if (cheque == "") {
        $("#purchase_popup_text").html("Enter cheque no");
        $("#purchase_popup").popup("open");
        return false;
    }
    return true;
}

function submitPurchase() {
    if (validatePurchase()) {
        $("#purchase .ui-content a").addClass("remove-item");
        $("#purchase_spinner").empty();
        $("#purchase_spinner").append(loading);
        var supplier_id = $("#employee_list").val();
        var date = $("#purchase_date").val();
        var data = {
            supplier_id: supplier_id,
            item_id: 3, //$("#net_weight").val(),
            rate: $("#rate").val(),
            quantity: $("#qty").val(),
            total_amount: $("#purchase_total").html(),
            chq_no: $("#cheque_no").val(),
            date: date,
            user_id: getVal(config.user_id)
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=purchase",
            data: data,
            cache: false,
            success: function (data) {
                $("#purchase .ui-content a").removeClass("remove-item");
                if (data.error == false) {
                    $("#purchase_spinner").empty();
                    $("#purchase_popup .ui-content a").removeAttr("href");
                    $("#purchase_popup .ui-content a").attr("data-rel", "back");
                    $("#purchase_popup_text").html(data.message);
                    $("#purchase_popup").popup("open");
                    $("#emp_code").html(" ");
                    showSupplierList();
                    resetPurchase();
                } else {
                    $("#purchase_spinner").empty();
                    $("#purchase_popup .ui-content a").removeAttr("href");
                    $("#purchase_popup .ui-content a").attr("data-rel", "back");
                    $("#purchase_popup_text").html(data.message);
                    $("#purchase_popup").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#purchase .ui-content a").removeClass("remove-item");
                $("#purchase_spinner").empty();
                $("#purchase_popup .ui-content a").removeAttr("href");
                $("#purchase_popup .ui-content a").attr("data-rel", "back");
                $("#purchase_popup_text").html("Process faild. Please retry!!");
                $("#purchase_popup").popup("open");
            }
        });
    }
}


/**********   Collection Page functions ***/

function loadCustomerPaymentDetails() {
    customer_payment_details = [];
    $("#collection .ui-content table").addClass("remove-item");
    $("#collection_spinner").append(loading);
    $("#customer_list_collection").empty();
    $("#empty_cyls").html(0);
    $("#prev_bal").html(0);
    $("#curr_bal").val("");
    $("#received_pay").val("");
    $("#total_bal").html(0);
    var options = "<option value=''>--Select customer name--</option>";
    $("#collection_date").empty();
    var date = "";
    var date_options = "";
    var one_day = (60 * 60 * 24 * 1000);
    $.ajax({
        type: "GET",
        url: config.api_url + "module=admin&action=collection_customer_list",
        dataType: "json",
        cache: false,
        success: function (rs) {
            $("#collection .ui-content table").removeClass("remove-item");
            if (rs.error == false) {
                var from = rs.date.split("-");
                date = new Date(from[2], from[1] - 1, from[0]);
                date_options = "<option value='" + $.format.date(date, "dd-MM-yyyy") + "'>" + $.format.date(date, "dd-MM-yyyy") + "</option>"
                for (var i = 1; i <= 30; i++) {
                    date_options = date_options + "<option value='" + $.format.date(date - one_day, "dd-MM-yyyy") + "'>" + $.format.date(date - one_day, "dd-MM-yyyy") + "</option>";
                    date = date - one_day;
                }
                $.each(rs.data, function (cusindex, cusrow) {
                    options = options + "<option value='" + cusrow.id + "'>" + cusrow.name + "</option>";
                    customer_payment_details.push({id: cusrow.id, name: cusrow.name, balance: [{pending_cyls: cusrow.balance.pending_cylinder, pending_amt: cusrow.balance.pending_amount}]});
                });
                $("#customer_list_collection").append(options);
                $("#collection_date").append(date_options);
                $("#collection_spinner").empty();
            } else {
                $("#customer_list_collection").append("<option value=''>--No customers--</option>");
                $("#collection_spinner").empty();
            }
        },
        error: function (request, status, error) {
            $("#collection .ui-content table").removeClass("remove-item");
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
                    $("#empty_cyls").html(pendingrow.pending_cyls);
                    $("#prev_bal").html(pendingrow.pending_amt);
                });
                return false;
            }
        });
    }
}

function calcBalance() {
    $("#collection_spinner").empty();
    $("#received_pay").keyup(function (e) {
        var balance = parseInt($("#prev_bal").html());
        var received = parseInt($(this).val());
        if (received != 0 && received <= balance) {
            $("#total_bal").html(balance - received);
        } else if (received != 0 && received > balance) {
            $("#total_bal").html("Received amt is grater than balance amt");
        } else {
            $("#total_bal").html(balance);
        }
    });

}

function sendCollectionDetails() {
    var customer = $("#customer_list_collection").val();
    var balance = parseInt($("#prev_bal").html());
    var received = parseInt($("#received_pay").val());
    if (customer != "" && received <= balance) {
        $("#collection .ui-content a").addClass("remove-item");
        $("#collection_spinner").append(loading);
        var data = {
            employee_id: getVal(config.user_id),
            id: customer,
            amount: $("#received_pay").val(),
            item_id: 3,
            date: $("#collection_date").val()
        };
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=collection_completed",
            data: data,
            cache: false,
            success: function (data) {
                $("#collection_spinner").empty();
                $("#collection .ui-content a").removeClass("remove-item");
                if (data.error == false) {
                    $("#collection_popup .ui-content a").removeAttr("href");
                    $("#collection_popup .ui-content a").attr("data-rel", "back");
                    $("#collection_popup_text").html(data.message);
                    $("#collection_popup").popup("open");
                    loadCustomerPaymentDetails();
                } else {
                    $("#collection_popup .ui-content a").removeAttr("href");
                    $("#collection_popup .ui-content a").attr("data-rel", "back");
                    $("#collection_popup_text").html(data.message);
                    $("#collection_popup").popup("open");
                    loadCustomerPaymentDetails();
                }
            },
            error: function (request, status, error) {
                $("#collection .ui-content a").removeClass("remove-item");
                $("#collection_spinner").empty();
                $("#collection_popup .ui-content a").removeAttr("href");
                $("#collection_popup .ui-content a").attr("data-rel", "back");
                $("#collection_popup_text").html("Loading faild please try after sometimes later...");
                $("#collection_popup").popup("open");
            }
        });
    } else if (customer != "" && received > balance) {
        $("#collection_spinner").empty();
        $("#collection_popup .ui-content a").removeAttr("href");
        $("#collection_popup .ui-content a").attr("data-rel", "back");
        $("#collection_popup_text").html("Received amt is grater than balance amt");
        $("#collection_popup").popup("open");
    } else {
        $("#collection_spinner").empty();
        $("#collection_popup .ui-content a").removeAttr("href");
        $("#collection_popup .ui-content a").attr("data-rel", "back");
        $("#collection_popup_text").html("Please enter amt or select customer");
        $("#collection_popup").popup("open");
    }
}


/**********   Expense Detail Page functions ***/

function showExpenseDetail(id) {
    $("#show_expense_detail").empty();
    $("#expense_detail_header").empty();
    var out = '<table><tbody>';
    $.each(expenses_list, function (index, row) {
        if (row.id == id) {
            $("#expense_detail_header").html("Expense id #" + row.id);
            out = out + '<tr><td>Reason</td><td>' + row.reason + '</td></tr>';
            out = out + '<tr><td>Amount</td><td>' + parseInt(row.amt) + '</td></tr>';
            out = out + '<tr><td>Status</td><td>' + row.status + '</td></tr>';
            out = out + '<tr><td>Date</td><td>' + $.format.date(row.date, "dd-MMM-yy") + '</td></tr>';
            return false;
        }
    });
    out = out + '</tbody></table>';
    $(out).appendTo("#show_expense_detail").enhanceWithin();
}


/**********   List Expense Page functions ***/

function listExpenses() {
    expenses_list = [];
    var data = {employee_id: getVal(config.user_id)};
    $("#expenses_details").empty();
    $("#expenses_details").append(loading);
    var out = '<div><ul data-role="listview" data-inset="true" data-theme="a">';
    $.ajax({
        type: "POST",
        url: config.api_url + "module=admin&action=expenses_list",
        data: data,
        cache: false,
        success: function (data) {
            if (data.error == false) {
                $("#expenses_details").empty();
                $.each(data.data, function (index, row) {
                    expenses_list.push({id: row.id, reason: row.reason, amt: row.amount, status: row.status, date: row.date});
                    out = out + '<li><a href="#expense_detail?id=' + row.id + '" class="ui-btn ui-btn-corner-all">#' + row.id + '. on ' + $.format.date(row.date, "dd-MMM-yy") + ' value of &#8377; ' + parseInt(row.amount) + '</a></li>';
                });
                $(out).appendTo("#expenses_details").enhanceWithin();
            } else {
                $("#expenses_details").empty();
                $("#expenses_details").append(data.message);
            }
        },
        error: function (request, status, error) {
            $("#expenses_details").empty();
            $("#expenses_details").append("Loading failed please try again......");
        }
    });
}


/**********   Expense Page functions ***/

function recordExpense() {
    var reason = $("#expense_type").val();
    var amt = $("#expense_amt").val();
    var data = {
        employee_id: getVal(config.user_id),
        reason: reason,
        amount: amt,
        date: $("#expense_date").val()
    };
    if (amt != "") {
        $("#expense .ui-content a").addClass("remove-item");
        $("#expense_spinner").empty();
        $("#expense_spinner").append(loading);
        $.ajax({
            type: "POST",
            url: config.api_url + "module=admin&action=post_expenses",
            data: data,
            cache: false,
            success: function (data) {
                $("#expense .ui-content a").removeClass("remove-item");
                $("#expense_spinner").empty();
                if (data.error == false) {
                    $("#expense_popup .ui-content a").removeAttr("href");
                    $("#expense_popup .ui-content a").attr("data-rel", "back");
                    $("#expense_popup_text").html(data.message);
                    $("#expense_popup").popup("open");
                    cancelExpense();
                } else {
                    $("#expense_popup .ui-content a").removeAttr("href");
                    $("#expense_popup .ui-content a").attr("data-rel", "back");
                    $("#expense_popup_text").html(data.message);
                    $("#expense_popup").popup("open");
                }
            },
            error: function (request, status, error) {
                $("#expense .ui-content a").removeClass("remove-item");
                $("#expense_spinner").empty();
                $("#expense_popup .ui-content a").removeAttr("href");
                $("#expense_popup .ui-content a").attr("data-rel", "back");
                $("#expense_popup_text").html("Loading faild please try after sometimes later...");
                $("#expense_popup").popup("open");
            }
        });
    } else {
        $("#expense_popup .ui-content a").removeAttr("href");
        $("#expense_popup .ui-content a").attr("data-rel", "back");
        $("#expense_popup_text").html("Please enter an amount");
        $("#expense_popup").popup("open");
    }
}

function cancelExpense() {
    $("#expense_amt").val("");
    $("#expense_type").val("");
    showExpenseDate();
}

function showExpenseDate() {
    $("#expense_date").empty();
    var date = new Date();
    var date_options = "<option value='" + $.format.date(date, "dd-MM-yyyy") + "'>" + $.format.date(date, "dd-MM-yyyy") + "</option>";
    var one_day = (60 * 60 * 24 * 1000);
    for (var i = 1; i <= 30; i++) {
        date_options = date_options + "<option value='" + $.format.date(date - one_day, "dd-MM-yyyy") + "'>" + $.format.date(date - one_day, "dd-MM-yyyy") + "</option>";
        date = date - one_day;
    }
    $("#expense_date").append(date_options);
}