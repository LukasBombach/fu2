module Views
  class ChannelList < ListView

    attrs :current_user

    fetches :recent_channels, proc { Channel.recent_channels(current_user, page, per_page) }
    fetches :channels_read, proc {
      recent_channels.each do |channel|
        channel.read = channel.has_posts?(current_user, channel.last_post)
      end
      nil
    }, [:recent_channels]

    fetches :count, proc { Channel.count }
    fetches :start_index, proc { (page - 1) * per_page }
    fetches :end_index, proc { (page - 1) * per_page + recent_channels.size }, [:recent_channels]
    fetches :last_update, proc { (recent_channels.map(&:created_at) + recent_channels.map(&:updated_at) + recent_channels.map(&:last_post_date)).map(&:utc).max.to_i }, [:recent_channels]
  end
end
