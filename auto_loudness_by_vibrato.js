function getClientInfo() {
    return {
        "name": "auto loudness by vibrato",
        "category": "tool",
        "author": "Rin von Rheinhauss",
        "versionNumber": 1,
        "minEditorVersion": 66049
    };
}

function main() {
    warning_save();
    SV.finish();
}
function warning_save() {
    SV.showMessageBox("auto loudness by vibrato: WARNING",
        "This script may override your own loudness parameters!\n\
         Please save or backup the project file in advance!");
    SV.finish();
}