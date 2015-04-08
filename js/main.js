var dummyPost = {
    image: 'http://cdn.thedailybeast.com/content/dailybeast/articles/2015/04/07/obama-pitched-a-great-iran-deal-in-2013/jcr:content/image.crop.174.116.jpg/1428398108366.cached.jpg',
    headline: 'Blessed is he who',
    url: '#',
    date: 'April 6, 2015',
    description: 'The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men. Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness, for he is truly his brother\'s keeper and the finder of lost children. And I will strike down upon thee with great vengeance and furious anger those who would attempt to poison and destroy My brothers. And you will know My name is the Lord when I lay My vengeance upon thee.'
}

window.DB = window.DB || {views:{},models:{},collections:{}};

DB.models.Article = Backbone.Model.extend({
    defaults: {
        image: '',
        headline: '',
        url: '',
        date: '',
        description: ''
    }
});

DB.collections.Articles = Backbone.Collection.extend({
    model: DB.models.Article,
    generate: function(ct, opts) {
        var success = opts.success || false;
        for (var i = 0; i < ct; i++) {
            this.add(dummyPost);
        }
        if (success) success();
    }
})

DB.views.Article = Backbone.View.extend({
    tagName: "article",
    className: "list-item",
    template: _.template($('#template-article-list').html()),
    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

DB.views.Articles = Backbone.View.extend({
    el: $('.articles'),
    initialize: function() {
        this.collection = new DB.collections.Articles();
        this.collection.generate(10, {success: this.render.bind(this)});
    },
    render: function() {
        var $articles = $();
        this.collection.each(function(article) {
            $articles = $articles.add(new DB.views.Article({model:article}).render().$el);
        });
        this.$el.html($articles);
    }
});

DB.app = DB.app || new DB.views.Articles();
