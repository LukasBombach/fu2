// var React = require('react');
// var LoadingIndicator = require("./loading-indicator");

var ChannelPostsData = {
  url: "/api/channels/{id}/posts.json",
  result: {
    posts: ["post"],
    channel: "channel"
  },
  view: "channel-$ID-post",
  subscribe: [
    "post_create",
    "post_fave",
    "post_unfave"
  ]
};

function replyMessage(post) {
  $(".comment-box-form textarea").val(post.body.replace(/^/, "> ")+"\n\n").select();
}

var FaveCounter = React.createClass({
  getInitialState: function() {
    return {state: 0};
  },
  click: function(e) {
    e.preventDefault();
    if(this.props.postId > 0) {
      var c = this;
      $.ajax({url:"/api/posts/"+this.props.postId+"/fave", dataType: "json", type: "post"}).done(function(data) {
        console.log(data);
        Data.update("post", c.props.postId, data.post);
      });
    }
  },
  render: function() {
    var icon = <span className="octicon octicon-star" />;
    var inner = null;
    if(!this.props.faves || this.props.faves.length == 0) inner = <span>{icon}{'0'}</span>;
    else inner = <span>{icon}{this.props.faves.length}</span>;
    var className = "";
    if(this.props.faves.length > 0) className = "faved";
    if(this.state.state == 1) className = "on";
    return <a href="#" title={(this.props.faves ? this.props.faves : []).join(", ")} onClick={this.click} className={className}>{inner}</a>;
  }
});

var ChannelPostHeader = React.createClass({
  edit: function() {
    this.props.channelPost.setState({edit: true});
  },
  reply: function(e) {
    replyMessage(this.props.post);
    e.preventDefault();
  },
  unread: function(e) {
    console.log("unread");
    e.preventDefault();
  },
  render: function() {
    var userLink = "/users/"+this.props.user.id;
    var postLink = "/channels/"+this.props.channelId+"#post-"+this.props.id;
    var canEdit = false;
    var postDeleteLink = canEdit ? <a href="#" className="post-delete" onClick={this.delete}><span className="octicon octicon-trashcan"></span></a> : null;
    var postEditLink = canEdit ? <a href="#" className="post-edit" onClick={this.edit}><span className="octicon octicon-pencil"></span></a> : null;
    var postUnreadLink = <a href="#" className="post-unread" onClick={this.unread}><span className="octicon octicon-eye"></span></a>;
    var postReplyLink = <a href="#" className="post-reply" onClick={this.reply}><span className="octicon octicon-mail-reply"></span></a>;
    var favers = [];
    for(var i in this.props.post.faves) {
      var fave = this.props.post.faves[i];
      favers.push(Data.get("user", fave.user_id).login);
    }
    return <div className="channel-post-header">
      <a className="avatar" href={userLink}><img className="avatar-image" src={this.props.user.avatar_url} /></a>
      <span className="user-name">{this.props.user.login}</span>
      <div className="right">
        {postDeleteLink}
        {postEditLink}
        <FaveCounter faves={favers} postId={this.props.id}  />
        {postUnreadLink}
        {postReplyLink}
        <a href={postLink} className="timestamp">
          <Timestamp timestamp={this.props.post.created_at} />
        </a>
      </div>
    </div>;
  }
})

var ChannelPost = React.createClass({
  getInitialState: function() {
    return {edit: false};
  },
  render: function() {
    var body = {__html: this.props.post.html_body};
    var className = "channel-post post-"+this.props.post.id;
    var name = "post-"+this.props.post.id;
    if(this.props.post.read) className += " read";
    if(this.props.highlight) className += " highlight";
    if(this.state.edit)
      var content = <div class="channel-response channel-edit"><CommentBox postId={this.props.id} channelId={this.props.channelId} /></div>;
    else
      var content = <div className="body" dangerouslySetInnerHTML={body}></div>;
    return <div className={className}>
      <a name={name} />
      <ChannelPostHeader id={this.props.id} channelId={this.props.channelId} user={this.props.user} post={this.props.post} channelPost={this} />
      {content}
    </div>;
  }
});

var ChannelPostsHeader = React.createClass({
  getInitialState: function() {
    return {edit: false};
  },
  toggleEdit: function(e) {
    e.preventDefault();
    this.setState({edit: !this.state.edit});
  },
  save: function() {
    if(this.props.channelId == 0) {
      var data = {body: $(".channel-text .body textarea").val(), title: $(".channel-title input.channel-title").val() };
      console.log(data);
      Data.create("channel", [], data, {error: function() {
        console.log("Failed to create channel...");
      }, success: function(data) {
        console.log(data);
        Router.open("channels/show", {channel_id: data.channel.id}, true);
      }});
    }
  },
  render: function() {
    var title = {__html: this.props.channel.display_name};
    if(this.state.edit || this.props.channelId == 0) {
      var title = this.props.channelId > 0 ? "Save" : "Create"
      if(this.props.channelId > 0) var cancelLink = <a onClick={this.toggleEdit} className="cancel-edit-channel-link" href="#">Cancel</a>;
      return <div>
        <h2 className="channel-title">
          <div className="right">
            <button onClick={this.save}>{title}</button>
            {cancelLink}
          </div>
          <input className="channel-title" placeholder="Channel Title" defaultValue={this.props.channel.title} />
        </h2>
        <div className="channel-text">
          <div className="body">
            <textarea defaultValue={this.props.channel.text} />
          </div>
        </div>
      </div>;
    } else {
      var body = {__html: this.props.channel.display_text};
      if(this.props.channel.text) {
        var channelText = <div className="channel-text">
          <div className="body text-body" dangerouslySetInnerHTML={body} />
        </div>;
      }
      return <div>
        <h2 className="channel-title">
          <div className="right"><a onClick={this.toggleEdit} className="edit-channel-link" href="#">Edit</a></div>
          <span className="title-text" dangerouslySetInnerHTML={title} />
        </h2>
        {channelText}
      </div>;
    }
  }
});

var ChannelPosts = React.createClass({
  getInitialState: function() {
    return {posts: [], channel: {}, view: {}, anchor: "", highlight: -1};
  },
  componentDidMount: function() {
    console.log(this.props.channelId);
    if(this.props.channelId > 0) {
      console.log("fetch");
      Data.subscribe("channel-"+this.props.channelId+"-post", this, 0, {callback: this.updatedPosts});
      Data.subscribe("channel", this, this.props.channelId, {callback: this.updatedChannel});
      Data.fetch(ChannelPostsData, this.props.channelId);
    }

    var self = this;
    this.keydownCallback = $(document).on("keydown", function(e) {
      if(!self.isMounted()) return;
      if(e.target != $("body").get(0)) return;
      if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var key = String.fromCharCode(e.keyCode);
      if(key == "J") {
        if(self.state.highlight+1 < self.state.posts.length)
          self.setState({highlight: self.state.highlight+1});
        else
          self.setState({highlight: 0});
        self.updateAnchor();
        e.preventDefault();
      }
      if(key == "K") {
        if(self.state.highlight > 0)
          self.setState({highlight: self.state.highlight-1});
        else
          self.setState({highlight: self.state.posts.length-1});
        self.updateAnchor();
        e.preventDefault();
      }
      if(key == "R") {
        if(self.state.highlight >= 0) {
          var post = self.state.posts[self.state.highlight];
          console.log(post);
          replyMessage(post);
          e.preventDefault();
        }
      }
    });
  },
  componentWillUnmount: function() {
    Data.unsubscribe(this);
    $(document).off("keydown", this.keydownCallback);
  },
  selectPost: function(post) {
    var h = "#post-"+post.id;
    if(document.location.hash != h) {
      history.pushState(null, null, location.pathname+h);
      if(this.isMounted())
        this.setState({anchor: h});
    }
    // console.log(["scroll", $(this.getDOMNode()).find(".post-"+post.id).offset().top])
    o = $(this.getDOMNode()).find(".post-"+post.id).offset();
    if(o) {
      $(window).scrollTop(o.top - 150);
      return true;
    }
    return false;
  },
  updateAnchor: function() {
    if(this.state.highlight >= 0) {
      var post = this.state.posts[this.state.highlight];
      if(post) {
        return this.selectPost(post);
        // var h = "#post-"+post.id;
        // if(h != document.location.hash)
          // document.location.hash = h;
      }
    }
    return false;
  },
  updatedPosts: function(objects, view) {
    highlight = this.state.highlight;
    var jump = false;
    if(highlight == -1) {
      for(var p in objects) {
        var post = objects[p];
        if((this.state.anchor.length > 0 && post.id == parseInt(this.state.anchor.replace(/#?post-/, '')))) {
          console.log(["found", parseInt(p)]);
          highlight = parseInt(p);
          jump = true;
          break;
        }
      }
    }
    this.setState({posts: objects, view: view, highlight: highlight, jump: true});
  },
  updatedChannel: function(objects, view) {
    if(objects.length > 0) this.setState({channel: objects[0]});
  },
  loadMore: function(e) {
    Data.fetch(ChannelPostsData, this.props.channelId, {first_id: this.state.view.start_id});
    e.preventDefault();
  },
  loadAll: function(e) {
    Data.fetch(ChannelPostsData, this.props.channelId, {last_id: 0, limit: this.state.view.count});
    e.preventDefault();
  },
  componentDidUpdate: function() {
    if(this.isMounted() && this.state.jump) {
      if(this.updateAnchor())
        this.setState({jump: false});
    }
  },
  render: function () {
    console.log(["anchor", this.state.anchor, this.state.highlight]);
    var anchorPostId = this.state.anchor == "" ? 0 : parseInt(this.state.anchor.replace(/#?post-/, ''))
    console.log(anchorPostId);
    if(this.props.channelId > 0 && (this.state.posts.length < 1 || !this.state.channel.id)) return <LoadingIndicator />;
    if(this.props.channelId > 0) {
      var channelId = this.props.channelId;
      var highlight = this.state.highlight;
      var posts = this.state.posts.map(function(post, i) {
        var user = Data.get("user", post.user_id);
        return <ChannelPost key={post.id} id={post.id} highlight={i == highlight} channelId={channelId} user={user} post={post} />
      });
      var commentbox = <div>
        <a name="comments"></a>
        <h3 className="channel-response-title">Comment</h3>
        <div className="channel-response">
          <CommentBox channelId={channelId} />
        </div>
      </div>;
    }
    return <div>
      <ChannelPostsHeader channelId={this.props.channelId} channel={this.state.channel} />
      <ViewLoader callback={this.loadMore} callbackAll={this.loadAll} visible={this.state.posts.length} count={this.state.view ? this.state.view.count : 0} octicon={"chevron-up"} message={"older posts"} messageAll={"Show all"} />
      {posts}
      {commentbox}
    </div>;
  }
});

// module.exports = ChannelPosts;
window.ChannelPosts = ChannelPosts;
