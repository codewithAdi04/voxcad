import math

class NeuralCAD:
    def __init__(self):
        self.nodes = []
        self.state = "idle"

    def create_node(self, command):
        self.nodes.append(command)

    def disperse(self):
        self.state = "dispersed"

    def assemble(self):
        self.state = "assembled"

    def get_graph(self):
        return self

    @property
    def nodes(self):
        return self._nodes

    @nodes.setter
    def nodes(self, value):
        self._nodes = value