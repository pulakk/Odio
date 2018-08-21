from keras.models import Sequential
from keras.layers import Dense
from keras.layers import LSTM
import numpy as np
from keras.preprocessing.sequence import pad_sequences

def load_sequences(folder_name, max_sqlen):
	maxlen = 8
	files = ['dub','chik','thees']
	inp = []
	labels = []
	seq_len = []

	for i in range(len(files)):
		file = open(folder_name+files[i]+'.txt')
		tmp_list = []
		for line in file.readlines():
			if line.strip()=="":
				if len(tmp_list) > 0:
					seq_len.append(len(tmp_list))
					labels.append(i)
					inp.append(tmp_list)
					tmp_list = []
			else:
				tmp_list.append([int(x) for x in line.split(',')])

	inp = pad_sequences(np.array(inp), maxlen = maxlen, padding = 'post')
	labels = np.array(labels)
	sq_len = np.array(seq_len)
	return inp, labels, sq_len, maxlen, inp.shape[2]

def shuffle_sequences(data, labels, sqlens, maxlen, feature_size):
	data = np.reshape(data, [-1, maxlen * feature_size])
	labels = np.reshape(labels, [-1, 1])
	sqlens = np.reshape(sqlens, [-1, 1])

	combined = np.append(data, labels, axis = 1)
	combined = np.append(combined, sqlens, axis = 1)

	np.random.shuffle(combined)

	data = combined[:,:maxlen*feature_size]
	labels = combined[:,maxlen*feature_size]
	sqlens = combined[:,maxlen*feature_size+1]

	data = np.reshape(data, [-1, maxlen, feature_size])
	labels = np.eye(3)[np.reshape(labels, [-1])]
	sqlens = np.reshape(sqlens, [-1])

	return data, labels, sqlens


if __name__=="__main__":
	xtrain, ytrain, lenstrain, maxlen, feature_size = load_sequences("data_train/", max_sqlen = 8)
	xtrain, ytrain, lenstrain = shuffle_sequences(xtrain, ytrain, lenstrain, maxlen, feature_size)

	xtest, ytest, lenstest, maxlen, feature_size = load_sequences("data_test/", max_sqlen = 8)
	xtest, ytest, lenstest = shuffle_sequences(xtest, ytest, lenstest, maxlen, feature_size)

	model = Sequential()
	model.add(LSTM(16, input_shape = (maxlen, feature_size)))
	model.add(Dense(3,activation = 'sigmoid'))

	model.compile(loss = 'binary_crossentropy', optimizer = 'Adam', metrics = ['accuracy'])
	model.fit(xtrain, ytrain, epochs = 20, batch_size  = 16)

	scores = model.evaluate(xtest, ytest, verbose = 0)
	print(scores)
	model.save('models/model.h5')
	# with open('models/model.json', 'w') as f:
	#     f.write(model.to_json())
