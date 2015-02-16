/**
 * Global config file to load server / application settings and constants 
 */
config = function () {
    'use strict';
    return {
        showlog: 3, // 0: "Disabled", 1: "Error", 2: "Warning", 3: "Info"
        api_url: "http://jayam.co.uk/gas/api.php?",
        user_name: "e-gas_user_name",
        user_mobile: "e-gas_user_mobile",
        user_email: "e-gas_user_email",
        user_password: "e-gas_user_password",
        user_address1: "e-gas_user_address1",
        user_address2: "e-gas_user_address2",
        user_area: "e-gas_user_area",
        user_pincode: "e-gas_user_pincode",
        user_city: "e-gas_user_city",
        user_image: "e-gas_user_image",
        user_id: "e-gas_userid",
        cylinder_type: "e-gas_cylinder_type",
        user_status: "e-gas_user_status",
        user_alternet_number: "e-gas_user_alternet_number",
        device_token: "e-gas_device_token",
        app_config: "e-gas_app_config",
        product_list: "e-gas_product_list"
    };
}();

function setVal(key, value) {
    window.localStorage.setItem(key, value);
}

function getVal(key) {
    var value;
    value = window.localStorage.getItem(key);
    return  value;
}

function removeVal(key) {
    window.localStorage.removeItem(key);
}

function clearAll() {
    window.localStorage.clear();
}