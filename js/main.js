var dummyPost = {
    image: 'http://cdn.thedailybeast.com/content/dailybeast/articles/2015/04/07/obama-pitched-a-great-iran-deal-in-2013/jcr:content/image.crop.174.116.jpg/1428398108366.cached.jpg',
    headline: 'Blessed is he who',
    url: '#',
    date: 'April 6, 2015',
    description: 'The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men. Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness, for he is truly his brother\'s keeper and the finder of lost children. And I will strike down upon thee with great vengeance and furious anger those who would attempt to poison and destroy My brothers. And you will know My name is the Lord when I lay My vengeance upon thee.'
}

window.DB = window.DB || {views:{},models:{},collections:{}};

DB.transEndEventName = function() {
    var transEndEventNames = {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
    };
    return transEndEventNames[ Modernizr.prefixed('transition') ];
};

DB.models.Article = Backbone.Model.extend({
    defaults: {
        image: '',
        headline: '',
        url: '',
        date: '',
        description: '',
        current: false
    }
});

DB.collections.Articles = Backbone.Collection.extend({
    model: DB.models.Article,
    generate: function(ct, opts) {
        var success = opts.success || false,
            model;
        for (var i = 0; i < ct; i++) {
            model = $.extend({}, dummyPost);
            model.headline = i + ' ' + model.headline;
            this.add(model);
        }
        this.at(0).set('current', true);
        if (success) success();
    }
})

DB.views.Article = Backbone.View.extend({
    tagName: "article",
    className: function() {
        var className = "list-item";
        if (this.model.get('current')) className += " current";
        return className;
    },
    template: _.template($('#template-article-list').html()),
    initialize: function() {
        this.model.on('change:current', this.isCurrent, this);
    },
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    isCurrent: function() {
        this.$el.toggleClass('current', this.model.get('current'));
    }
});

DB.views.Articles = Backbone.View.extend({
    el: $('.articles'),
    events: function() {
        var events = {
            'touchstart': 'touchH'
        };
        events[DB.transEndEventName() + ' .current.anim'] = 'cleanup';
        return events;
    },
    initialize: function() {
        //bind this to callbacked functions
        _.bindAll(this, 'touchH', 'animationTasks');
        this.collection = new DB.collections.Articles();
        this.collection.generate(10, {success: this.render.bind(this)});
        this.actionQueue = this.actionQueue || [];
    },
    render: function() {
        var $articles = $();
        this.collection.each(function(article) {
            $articles = $articles.add(new DB.views.Article({model:article}).render().$el);
        });
        this.$el.html($articles);
    },
    touchH: function(e) {
        var $target;
        if (this.collection.length < 2) return;
        switch(e.type) {
        case 'touchstart':
            this.$el.on('touchmove touchend touchcancel', this.touchH);
            $target = this.$el.find('.current');
            $target = $target.add($target.prev()).add($target.next());
            $target.addClass('anim touching');
            this.isTouch = true;
            this.viewWidth = this.$el.outerWidth();
            this.startX = this.currentX = this._getPageX(e);
            this.startY = this._getPageY(e);
            this.animId = window.requestAnimationFrame(this.animationTasks);
            break;
        case 'touchmove':
            this.currentX = this._getPageX(e);
            if (Math.abs(this.currentX - this.startX) > 10) e.preventDefault();
            break;
        case 'touchcancel':
        case 'touchend':
            this.$el.off('touchmove touchend touchcancel');
            this.endX = this._getPageX(e);
            this.endY = this._getPageY(e);
            this._testTouch();
            //stop touching me
            this.isTouch = this.isTouching = false;
            break;
        }
    },
    goTo: function(dir, touch) {
        dir = (typeof dir === 'string') ? dir : this.actionQueue.shift();

        this.$el.find('.anim')
            .removeClass('touching')
            .addClass(((dir === 'next') ? 'forward' : 'backward') + ((touch) ? ' with-touch': ''))
            .removeAttr('style');
    },
    cleanup: function() {
        var dir = this.$el.find('.forward').length ? 1 : -1,
            idx = this.collection.indexOf(this.collection.findWhere({current: true})),
            target = Math.max(0,Math.min(this.collection.length - 1,idx + dir));
        this.$el.find('.anim').removeClass('anim forward backward touching with-touch');
        this.collection.findWhere({current: true}).set('current', false);
        this.collection.at(target).set('current', true);
        if (this.actionQueue.length) {
            this.animQueueId = window.requestAnimationFrame(this.goTo);
        } else {
            this.inAction = false;
        }
    },
    //translate various touch event formats to touch locations
    _getPageX: function(e) {
        if (typeof e.originalEvent === 'undefined')
            return false;
        else if (typeof e.originalEvent.changedTouches !== 'undefined')
            return e.originalEvent.changedTouches[0].pageX;
        else
            return e.originalEvent.pageX;
    },
    _getPageY: function(e) {
        if (typeof e.originalEvent === 'undefined')
            return false;
        else if (typeof e.originalEvent.changedTouches !== 'undefined')
            return e.originalEvent.changedTouches[0].pageY;
        else
            return e.originalEvent.pageY;
    },
    //format translate string
    _translate3dStr: function(x, y) {
        x = x || 0;
        y = y || 0;
        if (Modernizr.csstransforms3d) {
            return 'translate3d(' + x + 'px,' + y + 'px,0)';
        } else if (Modernizr.csstransforms) {
            return 'translateX('+ x + 'px) translateY('+ y + 'px)';
        }
    },
    _testTouch: function() {
        //test touch reaction
        var d = this.endX - this.startX,
            dir = '';
        if (d > 10) {
            dir = 'prev';
        } else if (d < -10) {
            dir = 'next';
        }
        this.goTo(dir, true);
    },
    _doSwipe: function() {
        var d = this.currentX - this.startX,
            prev, curr, next, show, noShow, opacity, opacityOff;
        if (!this.isTouching) {
            //don't respond to a small touch with a drag
            if (Math.abs(d) < 10) return;
            //update touch start when initalizing for the first time.
            this.startX = this.currentX;
            d = this.currentX - this.startX;
            this.isTouching = true;
        }

        //finger following slide
        prev = this._translate3dStr(-this.viewWidth + d);
        curr = this._translate3dStr(d);
        next = this._translate3dStr(this.viewWidth + d);

        // translate all images left or right by delta
        this.$el.find('.current').prev()
            .css(Modernizr.prefixed('transform'), prev);
        this.$el.find('.current')
            .css(Modernizr.prefixed('transform'), curr);
        this.$el.find('.current').next()
            .css(Modernizr.prefixed('transform'), next);
    },
    animationTasks: function() {
        if (this.isTouch) {
            //anim loop when touching
            this._doSwipe();
            this.animId = window.requestAnimationFrame(this.animationTasks);
        }
    }
});

DB.app = DB.app || new DB.views.Articles();
