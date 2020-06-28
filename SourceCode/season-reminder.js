/**
 * SeasonReminder
 * @param {Date} today 基準となる日付
 */
SeasonReminder = function(today) {
    this._today = today || new Date();
    this._date = this._getDefaultSeasonDate();
    this._color = this._getDefaultSeasonColor();
    // 季節が色に与える影響（基準は100）
    this.seasonInfluence = 100;
};

/**
 * 季節が最も色濃くなる日付（初期値）を取得する
 * @returns {Object} 季節の日付を格納したオブジェクト
 */
SeasonReminder.prototype._getDefaultSeasonDate = function() {
    const date = new Object();
    // 今年の四季を設定する
    date["spring"] = new Date(this._today.getFullYear() + "/3/21");     //春分
    date["summer"] = new Date(this._today.getFullYear() + "/6/22");     //夏至
    date["autumn"] = new Date(this._today.getFullYear() + "/9/23");     //秋分
    date["winter"] = new Date(this._today.getFullYear() + "/12/22");    //冬至

    // 去年の最後の季節を設定する
    const lastWinter = new Date(date["winter"].getTime());
    lastWinter.setFullYear(lastWinter.getFullYear() - 1);
    date["lastWinter"] = lastWinter;

    // 来年の最初の季節を設定する
    const nextSpring = new Date(date["spring"].getTime());
    nextSpring.setFullYear(nextSpring.getFullYear() + 1);
    date["nextSpring"] = nextSpring;
    return date;
};

/**
 * 季節を代表する色（初期値）を取得する
 * @return {Object} 季節の色を格納したオブジェクト
 */
SeasonReminder.prototype._getDefaultSeasonColor = function() {
    const color = new Object();
    // 今年の四季を設定する
    color["spring"] = "rgb(124, 252, 0)";
    color["summer"] = "rgb(255, 99, 71)";
    color["autumn"] = "rgb(210, 105, 30)";
    color["winter"] = "rgb(176, 224, 230)";

    // 去年の最後、来年の最初を設定する
    color["lastWinter"] = color["winter"];
    color["nextSpring"] = color["spring"];
    return color;
};

/**
 * 日付間の日数差を取得する
 * @param {Date} date1 日付1 
 * @param {Date} date2 日付2
 * @returns {Number} 日数差
 */
SeasonReminder.prototype._getDayDifference = function(date1, date2) {
    const dayMilliseconds = 86400000;
    return Math.abs(Math.ceil((date1 - date2) / dayMilliseconds));
};

/**
 * 基準日から算出した季節の度合い（0～100）を取得する
 * @returns {Array} 配列：オブジェクト（name：季節名、degree：度合い）
 */
SeasonReminder.prototype._getSeasonDegrees = function() {
    const degrees = [];
    // 日数差を計算する
    for (var season in this._date) {
        degrees.push(
            { 
                name : season, 
                degree : this._getDayDifference(this._today, this._date[season]) 
            }
        );
    };

    // 日数差で昇順ソート
    degrees.sort((a, b) => {
        return a.degree - b.degree;
    });

    // 最も近い季節2つ以外を排除する
    while (degrees.length > 2) {
        degrees.pop();
    };

    // 全体を100として季節感の比を計算
    const amount = degrees[0].degree + degrees[1].degree;
    degrees[0].degree = Math.round((degrees[0].degree / amount * 100));
    degrees[1].degree = Math.round((degrees[1].degree / amount * 100));
    return degrees;
};

/**
 * 季節を思い起こす色を取得する
 * @param {String} baseColor 対象となる色の表現 rgb(r, g, b）
 */
SeasonReminder.prototype.getRemindedColor = function( baseColor ) {
    // rgb(r, g, b)の形式かどうかチェックする
    const baseRgb = baseColor.match(/\d+/g);
    if (!baseRgb || baseRgb.length !== 3 || baseRgb.filter(x => !isNaN(x)).length !== 3) {
        return;
    }

    // 季節に対応する色を取得する
    const seasons = this._getSeasonDegrees();
    const primaryColor = this._color[seasons[0].name].match(/\d+/g);
    const secondaryColor = this._color[seasons[1].name].match(/\d+/g);

    // 2つの季節の色におけるRGBの差分を取得する
    const seasonRgb = [];
    for (var i = 0; i < primaryColor.length; i++) {
        const gap = Number(secondaryColor[i]) - Number(primaryColor[i]);
        const value = Number(primaryColor[i]) + Math.round(gap * (seasons[0].degree / 100));
        seasonRgb.push(value);
    }

    // ベース色と季節の色を合成する
    const resultRgb = [];
    for (var i = 0; i < baseRgb.length; i++) {
        const gap = seasonRgb[i] - Number(baseRgb[i]);
        let value = Number(baseRgb[i]) + Math.round(gap * (this.seasonInfluence / 100));
        // 0～255の範囲を超えている場合、限界値に調整する
        value = value < 0 ? 0 : value > 255 ? 255 : value;
        resultRgb.push(value);
    }

    // rgb(r, g ,b)の表現に変換する
    return "rgb(" + resultRgb.join(",") + ")";
};

/**
 * 要素の指定されたプロパティがrgb(r, g, b)の
 * 表現であれば季節を反映した色に変換して置き換える
 * @param {Element} element 要素
 * @param {String} propertyName プロパティ名 
 */
SeasonReminder.prototype.remind = function(element, propertyName) {
    // 対象のスタイルを取得する
    let style;
    style = style || window.getComputedStyle(element, "");              // 全般
    style = style || element.currentStyle;                              // IE6
    style = style || document.defaultView.getComputedStyle(element, "") // Safari

    // プロパティがなければ処理を終了する
    if (!style[propertyName]) {
        return;
    }

    // 新しいプロパティが取得できれば設定する
    const newProperty = this.getRemindedColor(style[propertyName]);
    element.style[propertyName] = newProperty || style[propertyName];
};

/**
 * 全ての要素の指定されたプロパティがrgb(r, g, b)の
 * 表現であれば季節を反映した色に変換して置き換える
 * @param {String} propertyName プロパティ名
 */
SeasonReminder.prototype.remindAll = function(propertyName) {
    const all = document.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
        this.remind(all[i], propertyName);
    }
};
