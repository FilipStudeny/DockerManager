from faker import Faker

fake = Faker()
class PullImageRequestBuilder:
    def __init__(self):
        self._repository = fake.domain_word()
        self._tag = "latest"

    def with_repository(self, repo: str):
        self._repository = repo
        return self

    def with_tag(self, tag: str):
        self._tag = tag
        return self

    def build(self):
        return PullImageRequest(repository=self._repository, tag=self._tag)
