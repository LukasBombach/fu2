class Api::ImagesController < Api::ApiController
  skip_before_filter :verify_authenticity_token, only: :create
  
  def create
    @image = Image.create image_params.merge(:user_id => current_user.id)
    respond_with @image
  end

  private
  def image_params
    params.require(:image).permit(:filename, :image_file, :user_id)
  end
end
