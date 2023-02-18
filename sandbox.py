from notebook import Notebook

ga = Notebook.load("genetic_algorithms")

# print(ga.run("Write an introduction paragraph to genetic algorithms."))

ga.start_live_source("sound")
input("Press enter to continue...")
ga.stop_live_source("sound")
