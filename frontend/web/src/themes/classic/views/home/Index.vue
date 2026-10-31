<script setup>
import HomeTopBar from '@/themes/classic/components/home/HomeTopBar.vue'
import GroupSidebar from '@/themes/classic/components/home/GroupSidebar.vue'
import WalletTable from '@/themes/classic/components/home/WalletTable.vue'
import StatusBar from '@/themes/classic/components/home/StatusBar.vue'
import TxTable from '@/themes/classic/components/tx/TxTable.vue'
import ImportWalletDialog from '@/themes/classic/components/wallet/ImportWalletDialog.vue'
import WatchWalletDialog from '@/themes/classic/components/wallet/WatchWalletDialog.vue'
import CreateWalletDialog from '@/themes/classic/components/wallet/CreateWalletDialog.vue'
import EditWalletDialog from '@/themes/classic/components/wallet/EditWalletDialog.vue'
import TransferDialog from '@/themes/classic/components/wallet/TransferDialog.vue'
import NetworkDialog from '@/themes/classic/components/network/NetworkDialog.vue'
import DrainDialog from '@/themes/classic/components/drain/DrainDialog.vue'
import BatchTransferDialog from '@/themes/classic/components/batch/BatchTransferDialog.vue'
import CollectDialog from '@/themes/classic/components/batch/CollectDialog.vue'
import SwapDialog from '@/themes/classic/components/swap/SwapDialog.vue'
import DappDialog from '@/themes/classic/components/dapp/DappDialog.vue'
import DappProposalDialog from '@/themes/classic/components/dapp/DappProposalDialog.vue'
import DappRequestDialog from '@/themes/classic/components/dapp/DappRequestDialog.vue'
import FontDialog from '@/themes/classic/components/home/FontDialog.vue'
import { useHomePage } from '@/composables/home/useHomePage'

const {
  walletStore, networkStore, txStore, dappStore,
  mode, activeGroupId, keyword, refreshing, dialogs,
  editingWallet, transferWallet, drainTargets, swapTargets, collectTargets, batchSender,
  visibleWallets, visibleTxs, defaultGroupId, drainCandidates, batchScope,
  drainHint, swapHint, drainDisabled, swapDisabled,
  collectHint, collectDisabled, batchHintText, batchDisabled,
  refresh, refreshMissing, refreshTransfer, refreshDrain, refreshSwap, refreshCollect, refreshBatch,
  openDrain, openSwap, openCollect, openBatch, openTransfer, openEdit, lock,
} = useHomePage()
</script>

<template>
  <div class="home">
    <HomeTopBar
      v-model:keyword="keyword"
      v-model:mode="mode"
      :refreshing="refreshing"
      :drain-hint="drainHint"
      :drain-disabled="drainDisabled"
      :swap-hint="swapHint"
      :swap-disabled="swapDisabled"
      :batch-hint="batchHintText"
      :batch-disabled="batchDisabled"
      :collect-hint="collectHint"
      :collect-disabled="collectDisabled"
      :dapp-pending="dappStore.pendingCount"
      @dapp="dialogs.dapp = true"
      @import="dialogs.import = true"
      @create="dialogs.create = true"
      @watch="dialogs.watch = true"
      @drain="openDrain(drainCandidates)"
      @swap="openSwap(drainCandidates)"
      @batch="openBatch"
      @collect="openCollect(drainCandidates)"
      @network="dialogs.network = true"
      @refresh="refresh"
      @font="dialogs.font = true"
      @lock="lock"
    />

    <div class="home__body">
      <GroupSidebar v-model="activeGroupId" />
      <TxTable v-if="mode === 'history'" :txs="visibleTxs" :filtered="txStore.txs.length > 0" />
      <WalletTable
        v-else
        :wallets="visibleWallets"
        :filtered="walletStore.wallets.length > 0"
        @edit="openEdit"
        @transfer="openTransfer"
        @swap="openSwap([$event])"
        @drain="openDrain([$event])"
        @import="dialogs.import = true"
        @create="dialogs.create = true"
        @watch="dialogs.watch = true"
      />
    </div>

    <StatusBar :mode="mode" />

    <ImportWalletDialog v-model="dialogs.import" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <CreateWalletDialog v-model="dialogs.create" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <WatchWalletDialog v-model="dialogs.watch" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <EditWalletDialog v-model="dialogs.edit" :wallet="editingWallet" />
    <TransferDialog v-model="dialogs.transfer" :wallet="transferWallet" :network="networkStore.activeNetwork" @done="refreshTransfer" />
    <NetworkDialog v-model="dialogs.network" />
    <FontDialog v-model="dialogs.font" />
    <DrainDialog v-model="dialogs.drain" :wallets="drainTargets" :network="networkStore.activeNetwork" @done="refreshDrain" />
    <SwapDialog v-model="dialogs.swap" :wallets="swapTargets" :network="networkStore.activeNetwork" @done="refreshSwap" />
    <BatchTransferDialog v-model="dialogs.batch" :wallets="walletStore.signableWallets" :default-wallet="batchSender" :recipients="batchScope" :network="networkStore.activeNetwork" @done="refreshBatch" />
    <CollectDialog v-model="dialogs.collect" :wallets="collectTargets" :network="networkStore.activeNetwork" @done="refreshCollect" />
    <DappDialog v-model="dialogs.dapp" />
    <DappProposalDialog v-if="dappStore.currentProposal" :key="dappStore.currentProposal.id" :proposal="dappStore.currentProposal" />
    <DappRequestDialog v-else-if="dappStore.currentRequest" :key="dappStore.currentRequest.id" :request="dappStore.currentRequest" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
  height: 100%;
  padding: var(--mx-space-sm);
}

.home__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--mx-space-sm);
}
</style>
