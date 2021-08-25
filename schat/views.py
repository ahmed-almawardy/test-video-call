from django.views.generic import TemplateView

class RoomHandler(TemplateView):
    template_name= 'schat/video.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["wss"] = self.request.build_absolute_uri('ws/')
        return context
    