function getClientInfo() {
    return {
        "name": SV.T("auto loudness by vibrato"),
        "category": "tool",
        "author": "Rin von Rheinhauss",
        "versionNumber": 1,
        "minEditorVersion": 66049
    };
}
function getTranslations(langCode) {
    if (langCode == "zh-cn") {
        return [
            // getClientInfo()
            ["auto loudness by vibrato", "根据颤音设置响度"],

            // warning_save()
            ["auto loudness by vibrato: WARNING", "根据颤音设置响度：警告"],
            ["This script may override your own loudness parameters!\nPlease save or backup the project file in advance!",
                "本脚本可能会覆盖您的响度参数！\n请预先保存或备份工程文件！"],

            // main()

            
            //
            
            ["Please enter a number here:", "请输入一个数字："],
            ["Please enter some text here:", "请输入一段文本："]
        ];
    }
    return [];
}

function main() {
    warning_save();
    SV.finish();
}
function warning_save() {
    SV.showMessageBox("auto loudness by vibrato: WARNING",
        SV.T("This script may override your own loudness parameters!\nPlease save or backup the project file in advance!"));
    SV.finish();
}