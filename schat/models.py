# from django.db import models
# from django.utils.timezone import localtime
# from django.contrib.auth import get_user_model
# from django.utils.translation import ugettext_lazy as _
# from django.contrib.humanize.templatetags.humanize import naturaltime
# from django.conf import settings


# class Message(models.Model):
#     body = models.CharField(_("body"), max_length=250)
#     created_at = models.DateTimeField(_("created at"), default=localtime)

#     #TODO::Refactor add is_viewed viewed_at make a through tabel
#     sender = models.ForeignKey(get_user_model(), limit_choices_to={
#         'is_staff': False, 'is_superuser': False
#     },
#     verbose_name=_("sender"), 
#     on_delete=models.CASCADE,
#     related_name='messages'
#     )

#     viewers = models.ManyToManyField(get_user_model(),
#     verbose_name=_("viewer"),
#     through='MessageViewer' 
#     # related_name='messages'
#     )

#     chat = models.ForeignKey(
#         "Chat",
#         verbose_name=_("chat"),
#         on_delete=models.CASCADE,
#         related_name="messages",
#     )

#     is_sent = models.BooleanField(_("is sent"), default=False)


#     # TODO:: dynamic using get_fields()
#     def ready_to_json(self):
#         # {field.field_name for field in  self._meta.get_fields()}
#         return {
#             "body": self.body,
#             "chat": str(self.chat),
#             "sender": str(self.sender),
#             "created_at": self.created_at.strftime(settings.TIME_FORMAT),
#             "is_sent": self.is_sent,
#             "viewed_at": self.viewed_at,
#             "natural_createdat": self.natural_createdat(),
#         }

#     def natural_createdat(self):
#         return str(naturaltime(self.created_at))

#     def __str__(self) -> str:
#         return self.body

# class MessageViewer(models.Model):
#     message = models.ForeignKey("Message", verbose_name=_("message"), on_delete=models.CASCADE)
#     viewer = models.ForeignKey(get_user_model(), limit_choices_to={
#         'is_staff': False, 'is_superuser': False
#     },
#     verbose_name=_("viewer"), 
#     on_delete=models.CASCADE,
#     related_name='viewed_messages'
#     )

#     viewed_at = models.DateTimeField(_("viewed at"), null=True, blank=True)


# class Chat(models.Model):
#     name = models.CharField(_("name"), unique=True, max_length=50)
#     moderator = models.ForeignKey(
#         get_user_model(),
#         verbose_name=_("moderator"),
#         on_delete=models.CASCADE,
#         related_name="chats",
#         limit_choices_to={"is_staff": True, "is_superuser": True},
#     )
#     users = models.ManyToManyField(
#         "user.User",
#         verbose_name=_("user"),
#         related_name="rooms",
#         limit_choices_to={"is_staff": False, "is_superuser": False},
#     )

#     room_admin = models.ForeignKey(
#         get_user_model(),
#         verbose_name=_("room_admin"),
#         on_delete=models.CASCADE,
#         related_name="controlled_rooms",
#         limit_choices_to={"is_staff": False, "is_superuser": False},
#         null=True,
#         blank=True
#     )

#     def __str__(self) -> str:
#         return self.name
