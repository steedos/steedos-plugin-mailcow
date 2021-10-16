module.exports = {
    copyPwd: function () {
        var webservices = Meteor.settings.public.webservices;
        
        // 初始密码取环境变量
        var config = webservices.mailcow || { initial_passwd: ''}, initial_passwd = config.initial_passwd;
        
        if (!config || !initial_passwd){
            initial_passwd = "";
        }

        var item_element = $('.record-action-custom-copyPwd');
        item_element.attr('data-clipboard-text', initial_passwd);
        if (!item_element.attr('data-clipboard-new')) {
        var clipboard = new Clipboard(item_element[0]);
        item_element.attr('data-clipboard-new', true);
        clipboard.on('success', function (e) {
            return toastr.success(TAPi18n.__('复制成功！'));
        });
        clipboard.on('error', function (e) {
            toastr.error('复制失败！');
            return console.error("e");
        });
        if (item_element[0].tagName === 'LI' || item_element.hasClass('view-action')) {
            return item_element.trigger("click");
        }
        }
    }
}