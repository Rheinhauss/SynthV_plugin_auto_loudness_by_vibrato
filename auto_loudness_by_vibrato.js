var SCRIPT_TITLE = "auto loudness by vibrato";
var debug_count = 0;

function getClientInfo() {
    return {
        "name": SV.T(SCRIPT_TITLE),
        "category": "tool",
        "author": "Rin von Rheinhauss",
        "versionNumber": 2,
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
            ["Please save or backup the project file in advance!", "请预先保存或备份工程文件！"],
            ["This script may override your own loudness parameters!", "本脚本可能会覆盖您的响度参数！"],
            ["Press OK to proceed, Cancel to cancel.", "点击确认以继续，或取消以取消。"],

            // alert_no_note_selected()
            ["No note is selected. This script will not execute.", "没有选择音符，因此脚本并不会执行。"],

            // main()
            ["Notice", "注意"],
            ["There is some point that over 12dB which involves in something like 'Clipping distortion' in parameter panel.",
                "某些参数点因为计算时超过了上限12dB，因此参数面板上会有类似削波失真的情况"],
            ["Strength(dB)", "强度(dB)"],
            ["Points per quarter", "每四分音符 参数点的数量"],
            ["mode", "模式"],
            ["overwrite", "覆盖"],
            ["add", "叠加"],
            ["simplify the curve", "简化参数曲线"],
            [" notes edited.", " 个音符已修改。"]
        ];
    }
    return [];
}
function warning_save() {
    var result = SV.showOkCancelBox(
        SV.T("auto loudness by vibrato: WARNING"),
        SV.T("This script may override your own loudness parameters!") + "\n"
        + SV.T("Please save or backup the project file in advance!") + "\n"
        + SV.T("Press OK to proceed, Cancel to cancel.")
    );
    return result;
}
function alert_no_note_selected() {
    SV.showMessageBox(
        SV.T("auto loudness by vibrato: WARNING"),
        SV.T("No note is selected. This script will not execute.")
    );
    SV.finish();
}

function modify_loudness(option) {
    var co_old = 1, co_new = 0;
    var flagOverPeakWarning = false;

    switch (option.mode) { // SV.T("add"), SV.T("overwrite")
        case 0:
            co_old = 1;
            co_new = 1;
            break;
        case 1:
            co_old = 0;
            co_new = 1;
            break;
        default:
            co_old = 1;
            co_new = 0;
            break;
    }

    var selection = SV.getMainEditor().getSelection();
    var selectedNotes = selection.getSelectedNotes();

    if (selectedNotes.length == 0)
        alert_no_note_selected();
    selectedNotes.sort(function (noteA, noteB) {
        return noteA.getOnset() - noteB.getOnset();
    });

    var num_notes = selectedNotes.length;
    var step = Math.floor(SV.QUARTER / option.density);
    var loudness = SV.getMainEditor().getCurrentGroup().getTarget().getParameter("loudness");
    var loudnesscopy = loudness.clone();
    var vibratoEnv = SV.getMainEditor().getCurrentGroup().getTarget().getParameter("vibratoEnv");
    var attrDefault = SV.getMainEditor().getCurrentGroup().getVoice();

    if (attrDefault.tF0VbrStart === undefined) attrDefault.tF0VbrStart = 0.250;
    if (attrDefault.tF0VbrLeft === undefined) attrDefault.tF0VbrLeft = 0.20;
    if (attrDefault.tF0VbrRight === undefined) attrDefault.tF0VbrRight = 0.20;
    if (attrDefault.dF0Vbr === undefined) attrDefault.dF0Vbr = 1;
    if (attrDefault.fF0Vbr === undefined) attrDefault.fF0Vbr = 5.50;

    for (var i = 0; i < num_notes; i++) {
        var n = {
            "attr": selectedNotes[i].getAttributes(),
            "start": selectedNotes[i].getOnset(),
            "end": selectedNotes[i].getEnd(),
            "duration": selectedNotes[i].getDuration(),
        };

        loudness.remove(n.start, n.end);
        if (isNaN(n.attr.tF0VbrStart)) n.attr.tF0VbrStart = attrDefault.tF0VbrStart;
        if (isNaN(n.attr.tF0VbrLeft)) n.attr.tF0VbrLeft = attrDefault.tF0VbrLeft;
        if (isNaN(n.attr.tF0VbrRight)) n.attr.tF0VbrRight = attrDefault.tF0VbrRight;
        if (isNaN(n.attr.dF0Vbr)) n.attr.dF0Vbr = attrDefault.dF0Vbr;
        if (isNaN(n.attr.pF0Vbr)) n.attr.pF0Vbr = 0;
        if (isNaN(n.attr.fF0Vbr)) n.attr.fF0Vbr = attrDefault.fF0Vbr;

        var project = SV.getProject();
        var tAxis = project.getTimeAxis();
        var tempomark = tAxis.getTempoMarkAt(n.start);
        var bpm = tempomark.bpm;
        var pb = [
            n.start,
            n.start + SV.seconds2Blick(n.attr.tF0VbrStart, bpm),
            n.start + SV.seconds2Blick(n.attr.tF0VbrStart + n.attr.tF0VbrLeft, bpm),
            n.end - SV.seconds2Blick(n.attr.tF0VbrRight, bpm),
            n.end
        ];

        for (var b = pb[0]; b <= pb[4]; b += step) {
            s = SV.blick2Seconds(b - pb[0], bpm);
            var t = loudnesscopy.get(b);

            var lScale_1 = vibratoEnv.get(b); // 颤音包络 vibratoEnv
            var lScale_2 = 0; // 音符属性 note properties

            if (b >= pb[0] && b <= pb[1]) lScale_2 = 0;
            else if (b > pb[1] && b <= pb[2]) lScale_2 = (b - pb[1]) / (pb[2] - pb[1]);
            else if (b > pb[2] && b <= pb[3]) lScale_2 = 1;
            else if (b > pb[3] && b <= pb[4]) lScale_2 = -(b - pb[4]) / (pb[4] - pb[3]);
            else lScale_2 = 0;

            var v = co_old * t + co_new * Math.sin(2 * Math.PI * n.attr.fF0Vbr * (s - n.attr.tF0VbrStart) + n.attr.pF0Vbr)
                * lScale_1 * lScale_2 * option.strength;
            if (v > 12) { v = 12; flagOverPeakWarning = true; }
            loudness.add(b, v);
        }
        if (option.simp) loudness.simplify(n.start, n.end, 0.001);
    }

    return {
        "flagOverPeakWarning": flagOverPeakWarning,
        "num_processed": num_notes
    };
}



function main() {
    if (warning_save() == false) { SV.finish(); return; };
    // custom dialog
    var form = {
        title: SV.T(SCRIPT_TITLE),
        message: "",
        buttons: "OkCancel",
        widgets: [
            {
                "name": "strength",
                "type": "Slider",
                "label": SV.T("Strength(dB)"),
                "format": "%1.2f",
                "minValue": 0,
                "maxValue": 6,
                "interval": 0.05,
                "default": 1
            },
            {
                "name": "density",
                "type": "Slider",
                "label": SV.T("Points per quarter"),
                "format": "%3.0f",
                "minValue": 4,
                "maxValue": 256,
                "interval": 1,
                "default": 32
            },
            {
                "name": "mode", "type": "ComboBox",
                "label": SV.T("mode"),
                "choices": [SV.T("add"), SV.T("overwrite")],
                "default": 0
            },
            {
                "name": "simp", "type": "CheckBox",
                "text": SV.T("simplify the curve"),
                "default": true
            }
        ]
    };

    var result = SV.showCustomDialog(form);
    if (result.status) {
        var option = {
            "density": result.answers.density,
            "strength": result.answers.strength,
            "mode": result.answers.mode,
            "simp": result.answers.simp
        };
        var r = modify_loudness(option);
        if (r.flagOverPeakWarning) {
            SV.showMessageBox(SCRIPT_TITLE + "    ",
                SV.T("There is some point that over 12dB which involves in something like 'Clipping distortion' in parameter panel.") + "\n"
                + r.num_processed.toString() + SV.T(" notes edited."));
        }
        else {
            SV.showMessageBox(SCRIPT_TITLE + "    ", r.num_processed.toString() + SV.T(" notes edited."));
        }

    }
    SV.finish();
}